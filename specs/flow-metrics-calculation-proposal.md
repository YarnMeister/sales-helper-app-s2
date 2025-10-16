# Flow Metrics Calculation - Original Logic vs Current Implementation

**Date**: October 2, 2025  
**Status**: Proposal for fixing broken flow metrics calculations

---

## Executive Summary

The flow metrics system was originally designed with a sophisticated canonical stage mapping system (see `flow-efficiency-report-design.md`). After a significant refactor, the current implementation uses a simpler JSONB-based config approach but **the calculation logic is broken** - it's not properly using the `pipedrive_deal_flow_data` table to calculate 7/14/30 day averages.

This document:
1. Explains the original design intent
2. Documents the current implementation
3. Proposes a fix to make calculations work with existing data

---

## Original Design (from flow-efficiency-report-design.md)

### Canonical Stage Model
- **Major stages**: LEAD, QUOTE, ORDER, PROCUREMENT, MFG, DELIVERY, PAYMENT
- **Sub-stages**: e.g., `LEAD.GENERATED`, `QUOTE.SENT`, `ORDER.RECEIVED`
- **Entry/Exit boundaries**: Each major stage defined by entry and exit sub-stages
- **Lead time calculation**: `exit.timestamp - entry.timestamp`

### Database Design
```sql
-- Immutable raw events
CREATE TABLE pd_stage_events (
  deal_id     BIGINT NOT NULL,
  pipeline_id BIGINT NOT NULL,
  stage_id    BIGINT NOT NULL,
  entered_at  TIMESTAMPTZ NOT NULL,
  left_at     TIMESTAMPTZ,
  PRIMARY KEY (deal_id, stage_id, entered_at)
);

-- Translation layer (SCD2)
CREATE TABLE stage_map_scd (
  pipeline_id    BIGINT,
  stage_id       BIGINT,
  sub_key        TEXT NOT NULL,  -- Maps to canonical sub-stage
  report_version INT,
  effective_from TIMESTAMPTZ,
  effective_to   TIMESTAMPTZ
);

-- Canonical boundaries
CREATE TABLE canonical_stage_boundaries (
  major_key     TEXT,
  entry_sub_key TEXT,  -- Start of major stage
  exit_sub_key  TEXT   -- End of major stage
);
```

### Calculation Logic
```sql
-- Get canonicalized events
SELECT e.deal_id, cs.major_key, sm.sub_key, e.entered_at, e.left_at
FROM pd_stage_events e
JOIN stage_map_scd sm ON sm.stage_id = e.stage_id
JOIN canonical_substage_dim cs ON cs.sub_key = sm.sub_key;

-- Calculate major stage durations
SELECT 
  deal_id,
  major_key,
  MIN(entered_at) FILTER (WHERE sub_key = entry_sub_key) AS entry_time,
  MIN(entered_at) FILTER (WHERE sub_key = exit_sub_key) AS exit_time,
  EXTRACT(EPOCH FROM (exit_time - entry_time)) AS duration_seconds
FROM canonicalized_events
GROUP BY deal_id, major_key;
```

### Period Filtering (7/14/30 days)
- Filter by `exit_time` (when the stage was completed)
- Calculate average of all deals that completed within the period
- Example: "7 days" = deals where `exit_time >= NOW() - INTERVAL '7 days'`

---

## Current Implementation

### Database Schema

#### `flow_metrics_config` table
```typescript
{
  id: uuid,
  metric_key: text,
  display_title: text,
  config: jsonb,  // Contains startStage and endStage
  sort_order: integer,
  is_active: boolean
}
```

#### `config` JSONB structure
```typescript
{
  startStage: {
    id: number,           // stage_id
    name: string,         // stage_name
    pipelineId: number,
    pipelineName: string
  },
  endStage: {
    id: number,           // stage_id
    name: string,         // stage_name
    pipelineId: number,   // Can differ from startStage!
    pipelineName: string
  },
  thresholds: {
    minDays?: number,
    maxDays?: number
  },
  comment?: string
}
```

#### `pipedrive_deal_flow_data` table
```typescript
{
  id: uuid,
  deal_id: integer,
  pipeline_id: integer,
  stage_id: integer,
  stage_name: text,
  entered_at: timestamptz,  // When deal entered this stage
  left_at: timestamptz,     // When deal left this stage (null if current)
  duration_seconds: integer, // Time spent in THIS stage
  pipedrive_event_id: integer (unique)
}
```

**Key insight**: This table stores **per-stage durations**, not **cross-stage lead times**.

### Current Calculation Logic (BROKEN)

Located in `lib/db.ts` - `getDealsForCanonicalStage()`:

```typescript
// Get the mapping for this canonical stage
const mapping = await getCanonicalStageMapping(canonicalStage);

// Build filters for start and end stages
const startStageFilter = mapping.start_stage_id 
  ? sql`stage_id = ${mapping.start_stage_id}` 
  : sql`stage_name = ${mapping.start_stage}`;

const endStageFilter = mapping.end_stage_id 
  ? sql`stage_id = ${mapping.end_stage_id}` 
  : sql`stage_name = ${mapping.end_stage}`;

// Calculate duration between start and end stages
WITH start_stages AS (
  SELECT deal_id, entered_at as start_date
  FROM pipedrive_deal_flow_data
  WHERE ${startStageFilter}
),
end_stages AS (
  SELECT deal_id, entered_at as end_date
  FROM pipedrive_deal_flow_data
  WHERE ${endStageFilter}
)
SELECT 
  s.deal_id,
  s.start_date,
  e.end_date,
  EXTRACT(EPOCH FROM (e.end_date - s.start_date)) as duration_seconds
FROM start_stages s
JOIN end_stages e ON s.deal_id = e.deal_id
WHERE e.end_date > s.start_date
```

**Problem**: This references `canonical_stage_mappings` table which **no longer exists**!

---

## The Problem

1. **Missing table**: `getDealsForCanonicalStage()` calls `getCanonicalStageMapping()` which queries `canonical_stage_mappings` table
2. **Table was dropped**: Schema comment says "Removed: canonical_stage_mappings table (replaced with JSONB config in flow_metrics_config)"
3. **No migration**: The logic wasn't updated to use the new JSONB config structure
4. **Result**: Flow metrics page shows "N/A" or "0" for all metrics

---

## Proposed Solution

### Option 1: Update Existing Logic (Recommended)

Modify `lib/db.ts` to use `flow_metrics_config.config` JSONB instead of `canonical_stage_mappings`:

```typescript
export const getDealsForCanonicalStage = async (
  metricKey: string,  // Changed from canonicalStage
  period?: string
) => {
  return withDbErrorHandling(async () => {
    logInfo('Fetching deals for metric', { metricKey, period });
    
    // Get the metric config (JSONB contains start/end stage info)
    const metricConfig = await sql`
      SELECT config 
      FROM flow_metrics_config 
      WHERE metric_key = ${metricKey} 
      AND is_active = true
      LIMIT 1
    `;
    
    if (!metricConfig || metricConfig.length === 0) {
      logInfo('No config found for metric', { metricKey });
      return [];
    }
    
    const config = metricConfig[0].config;
    const startStageId = config.startStage.id;
    const endStageId = config.endStage.id;
    
    // Calculate period cutoff
    let cutoffDateFilter = sql``;
    if (period) {
      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '1m' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      cutoffDateFilter = sql`AND e.end_date >= ${cutoffDate.toISOString()}`;
    }
    
    // Get all deals that have both start and end stages
    const result = await sql`
      WITH deal_stages AS (
        SELECT 
          deal_id,
          stage_id,
          stage_name,
          entered_at,
          ROW_NUMBER() OVER (PARTITION BY deal_id, stage_id ORDER BY entered_at) as rn
        FROM pipedrive_deal_flow_data
        WHERE stage_id IN (${startStageId}, ${endStageId})
      ),
      start_stages AS (
        SELECT deal_id, entered_at as start_date
        FROM deal_stages 
        WHERE stage_id = ${startStageId} AND rn = 1
      ),
      end_stages AS (
        SELECT deal_id, entered_at as end_date
        FROM deal_stages 
        WHERE stage_id = ${endStageId} AND rn = 1
      )
      SELECT 
        s.deal_id,
        s.start_date,
        e.end_date,
        EXTRACT(EPOCH FROM (e.end_date - s.start_date))::BIGINT as duration_seconds
      FROM start_stages s
      JOIN end_stages e ON s.deal_id = e.deal_id
      WHERE e.end_date > s.start_date
      ${cutoffDateFilter}
      ORDER BY e.end_date DESC
    `;
    
    return result as any[];
  }, 'getDealsForCanonicalStage');
};
```

### Option 2: Create New Function (Cleaner)

Create a new function `getDealsForMetric()` and deprecate the old one:

```typescript
export const getDealsForMetric = async (
  metricKey: string,
  period?: string
) => {
  // Same implementation as Option 1
};
```

Update API routes to use new function:
- `app/features/flow-metrics/api/metrics/route.ts`
- `app/api/flow/canonical-stage-deals/route.ts`

---

## Implementation Plan

### Phase 1: Fix Core Calculation Logic
1. ✅ **Update `lib/db.ts`**:
   - Modify `getDealsForCanonicalStage()` to use `flow_metrics_config.config` JSONB
   - Remove dependency on `canonical_stage_mappings` table
   - Fix period filtering to use `end_date` (when stage completed)

2. ✅ **Update API routes**:
   - `app/features/flow-metrics/api/metrics/route.ts` - Pass `metric_key` instead of `canonical_stage`
   - `app/api/flow/canonical-stage-deals/route.ts` - Update to use new logic

3. ✅ **Test calculations**:
   - Verify 7/14/30 day averages calculate correctly
   - Verify cross-pipeline metrics work (different pipeline IDs for start/end)
   - Verify deals are filtered by completion date (end_date)

### Phase 2: Update Frontend
1. ✅ **Update hooks**:
   - `app/features/flow-metrics/hooks/useMetrics.ts` - Pass `metric_key` to API
   - Verify period selector works correctly

2. ✅ **Update components**:
   - Verify metric cards display correct averages
   - Verify "More Info" detail view shows correct deal list

### Phase 3: Testing
1. ✅ **Unit tests**:
   - Update `tests/unit/canonical-stage-mappings.test.ts` to test new logic
   - Add tests for period filtering (7d, 14d, 1m, 3m)
   - Add tests for cross-pipeline metrics

2. ✅ **Integration tests**:
   - Test full flow: config → calculation → display
   - Test with real Pipedrive data

---

## Migration Notes

### No Database Migration Required
- `pipedrive_deal_flow_data` table already has all necessary data
- `flow_metrics_config` table already has JSONB config
- Only code changes needed

### Backward Compatibility
- Old `canonical_stage_mappings` table can be safely dropped (already done)
- Old `getCanonicalStageMapping()` function can be deprecated
- API contracts remain the same (just internal implementation changes)

---

## Example Calculation

### Sample Data
```sql
-- flow_metrics_config
{
  metric_key: 'order-to-quality-control',
  display_title: 'Order Conversion',
  config: {
    startStage: { id: 501, name: 'Order Received', pipelineId: 5 },
    endStage: { id: 502, name: 'Quality Control', pipelineId: 5 }
  }
}

-- pipedrive_deal_flow_data
deal_id | stage_id | entered_at
--------|----------|------------
1467    | 501      | 2025-09-25 10:00:00  (start)
1467    | 502      | 2025-09-29 14:30:00  (end)
1468    | 501      | 2025-09-20 09:00:00  (start)
1468    | 502      | 2025-09-23 11:00:00  (end)
```

### Calculation (7 days period)
```sql
-- Today: 2025-10-02
-- Cutoff: 2025-09-25 (7 days ago)

-- Deal 1467: end_date = 2025-09-29 (within 7 days) ✅
--   Duration: 4.19 days (362,400 seconds)

-- Deal 1468: end_date = 2025-09-23 (outside 7 days) ❌
--   Excluded from calculation

-- Result:
--   Average: 4.19 days
--   Best: 4.19 days
--   Worst: 4.19 days
--   Total Deals: 1
```

---

## Success Criteria

✅ Flow metrics page displays calculated averages (not "N/A" or "0")  
✅ Period selector (7d/14d/1m/3m) filters deals correctly  
✅ Cross-pipeline metrics work (start and end in different pipelines)  
✅ "More Info" detail view shows correct deal list  
✅ Calculations match manual verification  
✅ All tests pass

---

## Next Steps

1. **Review this proposal** with team
2. **Implement Option 1** (update existing logic)
3. **Test thoroughly** with production data
4. **Deploy to production**
5. **Monitor** for calculation accuracy

---

**Questions?** See original design doc: `specs/Archive/flow-efficiency-report-design.md`

