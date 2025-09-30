# Flow Metrics Redesign - Implementation Plan

## 🎯 Objective
Redesign the Flow Metrics system to work with the new Pipedrive pipeline structure, using a JSONB-based configuration approach for simplicity and maintainability.

## 📋 Background
- Pipedrive pipeline setup was redesigned
- Current metrics are outdated and need to be replaced
- Old canonical_stage_mappings design was over-engineered
- Need to configure 9 new metrics across 8 different pipelines
- Webhook feeding pipedrive_deal_flow_data is broken (will fix separately)

## 🏗️ Architecture Decision: JSONB Configuration

**Pattern:** Follow the `requests.line_items` JSONB pattern
**Benefits:**
- Single table instead of two (remove canonical_stage_mappings)
- Atomic updates, no foreign key complexity
- Fewer JOINs, better performance
- Easy to extend configuration without schema changes

**New Structure:**
```json
{
  "metric_key": "general-supplies-lead-time",
  "display_title": "General Supplies Lead Time",
  "config": {
    "pipeline": { "id": 5, "name": "New Orders – General Items" },
    "startStage": { "id": 301, "name": "Order Received – General" },
    "endStage": { "id": 303, "name": "Order Ready – General" },
    "thresholds": { "minDays": 2, "maxDays": 14 },
    "comment": "Tracks fulfillment time for general supply orders"
  },
  "sort_order": 1,
  "is_active": true
}
```

## 📊 New Metrics to Configure

| # | Metric Name | Pipeline | Start Stage | End Stage |
|---|-------------|----------|-------------|-----------|
| **5** | General supplies Lead Time | New Orders – General Items | Order Received – General | Order Ready – General |
| **6** | Cable Order Lead Time | Ruan – New Orders – Cable Orders | Order Received – Ruan | Order Ready – Ruan |
| **7** | OEM Order Lead Time | Johan – New Orders – OEM | New Order Received – OEM | Order Ready – OEM |
| **8** | OEM – Repair strip and Quote Lead Time | Johan – Repairs – OEM | RFQ received – Repair OEM | Quote Sent – Repair |
| **9** | MetCoAir Order Lead Time | Michael – New Orders – MetCoAir | New Order Received – MKIV | Order Ready – MKIV |
| **10** | MetCoAir Repair Lead Time | Michael – Repairs – MetCoAir | RFQ received – Repair | Quote Sent – Repair |
| **11a** | OEM/General Delivery Lead Time | Dawie – Deliveries | OEM Order – In Laydown | Quality Control |
| **11b** | MetCoAir Delivery Lead Time | Dawie – Deliveries | OEM Order – In Laydown | Quality Control |
| **12** | Order to Cash | Finance | (New Orders Received – All Orders) New Orders | Invoice Paid |

## 🔧 Implementation Phases

### Phase 1: Database Migration (022_flow_metrics_jsonb_redesign.sql)

**Tasks:**
- [ ] Drop canonical_stage_mappings table completely
- [ ] Recreate flow_metrics_config with JSONB config column
- [ ] Add GIN index for JSONB queries
- [ ] Add JSONB validation function
- [ ] Add check constraint for config structure

**Schema:**
```sql
CREATE TABLE flow_metrics_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key TEXT NOT NULL UNIQUE,
  display_title TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fmc_config_gin ON flow_metrics_config USING GIN(config);
```

### Phase 2: TypeScript Schema & Types

**Files to Update:**
- [ ] `lib/database/schema.ts` - Update flowMetricsConfig table, remove canonicalStageMappings
- [ ] `types/features/flow-metrics.ts` - Define MetricConfigJSON interface
- [ ] `types/shared/database.ts` - Update FlowMetricsConfigEntity

**Key Types:**
```typescript
interface MetricConfigJSON {
  pipeline: { id: number; name: string };
  startStage: { id: number; name: string };
  endStage: { id: number; name: string };
  thresholds: { minDays?: number; maxDays?: number };
  comment?: string;
}

interface StageSelection {
  pipelineId: number;
  pipelineName: string;
  stageId: number;
  stageName: string;
}
```

### Phase 3: Database Functions (lib/db.ts)

**Remove:**
- [ ] All canonical_stage_mappings functions
- [ ] getCanonicalStageMappings()
- [ ] getCanonicalStageMapping()
- [ ] createCanonicalStageMapping()
- [ ] updateCanonicalStageMapping()

**Update:**
- [ ] createFlowMetricConfig() - Accept JSONB config
- [ ] getFlowMetricConfig() - Return JSONB config
- [ ] getActiveFlowMetricsConfig() - Return JSONB config
- [ ] updateFlowMetricConfig() - Update JSONB config
- [ ] deleteFlowMetricConfig() - Add deletion support

**New:**
- [ ] getDealsForMetric(metricId, period) - Query using JSONB config directly

### Phase 4: API Endpoints

**File: `app/api/admin/flow-metrics-config/route.ts`**
- [ ] GET - Return all metrics with JSONB config
- [ ] POST - Create metric with JSONB config
- [ ] PATCH - Update metric JSONB config
- [ ] DELETE - Delete metric

**File: `app/api/flow/metrics/route.ts`**
- [ ] Update to use getDealsForMetric() with JSONB config
- [ ] No more canonical_stage references

### Phase 5: Enhanced Pipedrive Stage Explorer

**File: `app/components/PipedriveStageExplorer.tsx`**

**Add Props:**
```typescript
interface PipedriveStageExplorerProps {
  mode?: 'view' | 'select';
  selectionType?: 'start' | 'end';
  currentSelection?: StageSelection | null;
  onStageSelect?: (stage: StageSelection) => void;
  onCancel?: () => void;
  otherStageSelection?: StageSelection | null; // For validation
}
```

**Features:**
- [ ] Selection mode with radio buttons
- [ ] Click handlers on stages
- [ ] Visual selection indicators
- [ ] Pipeline filtering (gray out if other pipeline already selected)
- [ ] Confirm/Cancel actions
- [ ] Validation warnings

### Phase 6: Metrics Management UI

**File: `app/components/MetricsManagement.tsx`**

**Remove:**
- [ ] Static STAGE_OPTIONS array
- [ ] Manual stage ID input fields
- [ ] All canonical_stage references

**Add:**
- [ ] Accordion-based stage selection
- [ ] Stage selection cards showing pipeline context
- [ ] Start stage selection button → opens explorer accordion
- [ ] End stage selection button → opens explorer accordion
- [ ] Visual stage cards when selected
- [ ] Form validation for same pipeline
- [ ] JSONB-aware form submission

**State Management:**
```typescript
const [formData, setFormData] = useState({
  metricKey: '',
  displayTitle: '',
  startStage: null as StageSelection | null,
  endStage: null as StageSelection | null,
  minDays: '',
  maxDays: '',
  comment: '',
  sortOrder: 0,
  isActive: true
});

const [stageSelectionState, setStageSelectionState] = useState<{
  isOpen: boolean;
  type: 'start' | 'end' | null;
}>({ isOpen: false, type: null });
```

### Phase 7: Defensive Data Handling

**Strategy:** Handle missing deal flow data gracefully

- [ ] Update KPI cards to show "No data" state
- [ ] Add data status indicator on main page
- [ ] Create import utility: `app/api/admin/import-deal-flow/route.ts`
- [ ] Create script: `scripts/import-pipedrive-flow-data.js`
- [ ] Test with mock data fixtures

**UI Updates:**
```typescript
// Show when no data available
<div className="text-3xl font-bold text-gray-400">—</div>
<div className="text-sm text-yellow-600">
  ⚠️ No data available
</div>
<div className="text-xs text-gray-500 mt-2">
  Import deal flow data to see metrics
</div>
```

### Phase 8: Data Import

**Script: `scripts/import-pipedrive-flow-data.js`**
- [ ] Fetch deals updated in last N days from Pipedrive
- [ ] For each deal, fetch flow history
- [ ] Import into pipedrive_deal_flow_data table
- [ ] Handle duplicates gracefully

**Usage:**
```bash
node scripts/import-pipedrive-flow-data.js 14  # Import last 14 days
```

## 🧪 Testing Checklist

### Local Testing
- [ ] Run migration 022 successfully
- [ ] Verify flow_metrics_config table structure
- [ ] Test creating a metric via UI
- [ ] Test stage selection accordion
- [ ] Test pipeline validation (start/end same pipeline)
- [ ] Verify JSONB config stored correctly
- [ ] Test metrics display page
- [ ] Test "No data" state display
- [ ] Import sample deal flow data
- [ ] Verify metrics calculate correctly

### Integration Testing
- [ ] All 9 metrics created successfully
- [ ] Pipedrive Stage Explorer shows all pipelines
- [ ] Metrics display with correct thresholds
- [ ] Color coding works (green/yellow/red)
- [ ] Period filtering works (7d/14d/1m/3m)

## 📝 Commit Strategy

**Branch:** `feature/flow-metrics-jsonb-redesign`

**Commits:**
1. Database migration and schema updates
2. TypeScript types and database functions
3. API endpoints update
4. Pipedrive Stage Explorer enhancements
5. Metrics Management UI redesign
6. Data import utilities
7. Testing and bug fixes

## 🚀 Deployment Plan

1. Test locally with npm run dev
2. Run npm run lint and fix errors
3. Run npm test and fix failing tests
4. Import deal flow data (last 14-30 days)
5. Create all 9 metrics via UI
6. Verify metrics display correctly
7. Commit to feature branch
8. When ready: Merge to main (requires approval)

## 📚 Key Files Reference

**Database:**
- `migrations/022_flow_metrics_jsonb_redesign.sql`
- `lib/database/schema.ts`
- `lib/db.ts`

**Types:**
- `types/features/flow-metrics.ts`
- `types/shared/database.ts`

**API:**
- `app/api/admin/flow-metrics-config/route.ts`
- `app/api/flow/metrics/route.ts`

**Components:**
- `app/components/MetricsManagement.tsx`
- `app/components/PipedriveStageExplorer.tsx`
- `app/flow-metrics-report/page.tsx`

**Scripts:**
- `scripts/import-pipedrive-flow-data.js`

## ⚠️ Important Notes

1. **Clean Slate:** Old metrics and canonical_stage_mappings will be deleted
2. **Webhook Broken:** Don't rely on automatic deal flow data updates
3. **Manual Import:** Plan to import 14-30 days of deal flow data manually
4. **UI First:** Can test UI and configuration before importing data
5. **Accordion UI:** Inline stage selection, not modals
6. **Pipeline Validation:** Enforce same pipeline for start/end stages
7. **JSONB Pattern:** Follow existing requests.line_items pattern

## ✅ Success Criteria

- [ ] User can create all 9 metrics without typing stage IDs
- [ ] Pipedrive Stage Explorer shows all current pipelines/stages
- [ ] Visual selection interface guides stage picking
- [ ] System validates pipeline consistency automatically
- [ ] Metrics calculate correctly using JSONB config
- [ ] "No data" state displays gracefully
- [ ] All tests pass
- [ ] Documentation updated

---

**Status:** Planning complete, ready for implementation
**Last Updated:** 2025-09-30
**Next Step:** Create feature branch and start Phase 1 (Database Migration)
