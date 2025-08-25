# Sales Helper App — Flow Efficiency Tracking (Design)

**Status:** Draft v2.0  
**Owner:** Jan / Sales Helper Team  
**Date:** 2025-08-24 (AEST)

---

## 1) Objective
Build a resilient, low-overhead capability to measure **lead times** and **flow efficiency** across the end-to-end (E2E) sales → provisioning lifecycle, while Pipedrive pipelines/stages change over time. The system must:

- Capture the *facts* of stage transitions and provisioning milestones (immutable history).
- Translate changing Pipedrive pipeline/stage IDs into a **stable canonical model** (major stages + sub-stages) using a versioned, effective-dated mapping layer.
- Compute lead time per lifecycle step and overall flow efficiency, based on **entry → exit timestamps** for each major stage.
- Provide admin tooling (mapping changes, unmapped detector) and analytic views for dashboards.
- Operate reliably at **10–50 events/day** with headroom.

---

## 2) Functional Components

### 2.1 Event Ingestion
- **Trigger:** When a deal hits the **final stage**, Zapier posts to the app; backend then calls Pipedrive `GET /deals/{id}/flow` to fetch the **full stage history** once per completed deal.
- **Future (optional):** Add more webhooks (e.g., any stage change; internal provisioning milestones) if near-real-time is needed.

### 2.2 Canonical Lifecycle Model
- **Major stages (fixed):** LEAD, QUOTE, ORDER, PROCUREMENT, MFG, DELIVERY, PAYMENT.  
- **Sub-stages (stable keys):** e.g., `LEAD.GENERATED`, `LEAD.RFQ_RECEIVED`, `QUOTE.SENT`, `ORDER.RECEIVED`, `PROC.SUPPLIER_ORDER_PLACED`, `MFG.STARTED`, `MFG.COMPLETED`, `DELIVERY.SCHEDULED`, `PAYMENT.RECEIVED`, etc.  
- Each major stage is defined by an **entry sub-stage** and an **exit sub-stage**.  
- Lead time for a major = `exit.timestamp – entry.timestamp`.  
- End-to-end lead time = time from first entry (LEAD) to final exit (PAYMENT).

### 2.3 Translation Layer (versioned, effective-dated)
- Decouples volatile Pipedrive IDs from canonical sub-stages.
- Implemented as a Slowly Changing Dimension (SCD2): `(pipeline_id, stage_id)` → `sub_key`, with `effective_from`, `effective_to`, and `report_version`.
- Reports can be re-run under any `report_version`; events always join to the mapping valid at the event time.

### 2.4 Analytics & Reporting
- Compute **durations** per major stage using entry/exit sub-stage boundaries.
- Roll up to total E2E lead time.
- **Flow efficiency** = (sum of all major stage lead times) ÷ (E2E total). Since only entry/exit points are tracked, all time is treated as productive.
- Provide materialised views for dashboards.
- Include unmapped detector jobs to catch events without mappings.

### 2.5 Admin UX
- Manage mappings with CRUD operations, drafts vs published versions.
- Impact Simulator to preview mapping changes against sample deals.
- Unmapped Events list with “Quick Map” actions.

---

## 3) Neon DB Changes

### 3.1 Canonical Dictionaries
```sql
CREATE TABLE canonical_major_stage_dim (
  major_key    TEXT PRIMARY KEY,      -- 'LEAD','QUOTE','ORDER','PROCUREMENT','MFG','DELIVERY','PAYMENT'
  display_name TEXT NOT NULL,
  sort_order   INT  NOT NULL
);

CREATE TABLE canonical_substage_dim (
  sub_key      TEXT PRIMARY KEY,      -- 'LEAD.GENERATED', 'QUOTE.SENT', ...
  major_key    TEXT NOT NULL REFERENCES canonical_major_stage_dim(major_key),
  display_name TEXT NOT NULL,
  sort_order   INT  NOT NULL
);

-- Entry/Exit mapping per major stage
CREATE TABLE canonical_stage_boundaries (
  major_key     TEXT NOT NULL REFERENCES canonical_major_stage_dim(major_key),
  entry_sub_key TEXT NOT NULL REFERENCES canonical_substage_dim(sub_key),
  exit_sub_key  TEXT NOT NULL REFERENCES canonical_substage_dim(sub_key),
  PRIMARY KEY (major_key)
);
```

### 3.2 Immutable Raw Events
```sql
CREATE TABLE pd_stage_events (
  deal_id     BIGINT NOT NULL,
  pipeline_id BIGINT NOT NULL,
  stage_id    BIGINT NOT NULL,
  entered_at  TIMESTAMPTZ NOT NULL,
  left_at     TIMESTAMPTZ,
  PRIMARY KEY (deal_id, stage_id, entered_at)
);

CREATE INDEX idx_pdse_deal_entered ON pd_stage_events (deal_id, entered_at);
CREATE INDEX idx_pdse_stage ON pd_stage_events (pipeline_id, stage_id);
```

### 3.3 Translation Layer (SCD2)
```sql
CREATE TABLE stage_map_scd (
  map_id         BIGSERIAL PRIMARY KEY,
  source_system  TEXT NOT NULL DEFAULT 'pipedrive',
  pipeline_id    BIGINT,
  stage_id       BIGINT,
  sub_key        TEXT NOT NULL REFERENCES canonical_substage_dim(sub_key),
  report_version INT  NOT NULL DEFAULT 1,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to   TIMESTAMPTZ,
  change_note    TEXT
);

CREATE INDEX idx_map_effective ON stage_map_scd (source_system, pipeline_id, stage_id, effective_from, COALESCE(effective_to,'infinity'));
CREATE INDEX idx_map_version   ON stage_map_scd (report_version);
```

### 3.4 Helper Views & Materialisations
```sql
-- Canonicalised events under a chosen report version
CREATE OR REPLACE FUNCTION fn_canonical_events(p_report_version INT)
RETURNS TABLE (
  deal_id BIGINT,
  major_key TEXT,
  sub_key TEXT,
  entered_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ
) LANGUAGE sql AS $$
  SELECT e.deal_id, cs.major_key, sm.sub_key, e.entered_at, e.left_at
  FROM pd_stage_events e
  JOIN stage_map_scd sm
    ON sm.source_system = 'pipedrive'
   AND (sm.pipeline_id IS NULL OR sm.pipeline_id = e.pipeline_id)
   AND (sm.stage_id    IS NULL OR sm.stage_id    = e.stage_id)
   AND sm.report_version = p_report_version
   AND sm.effective_from <= e.entered_at
   AND (sm.effective_to IS NULL OR e.entered_at < sm.effective_to)
  JOIN canonical_substage_dim cs ON cs.sub_key = sm.sub_key;
$$;

-- Major stage durations
CREATE MATERIALIZED VIEW mv_major_stage_durations AS
WITH canon AS (
  SELECT * FROM fn_canonical_events(1)
), bounds AS (
  SELECT
    c.deal_id,
    b.major_key,
    MIN(c.entered_at) FILTER (WHERE c.sub_key = b.entry_sub_key) AS entry_time,
    MIN(c.entered_at) FILTER (WHERE c.sub_key = b.exit_sub_key)  AS exit_time
  FROM canon c
  JOIN canonical_stage_boundaries b ON c.major_key = b.major_key
  GROUP BY c.deal_id, b.major_key
)
SELECT deal_id, major_key,
       EXTRACT(EPOCH FROM (exit_time - entry_time))::BIGINT AS duration_seconds
FROM bounds
WHERE entry_time IS NOT NULL AND exit_time IS NOT NULL;

-- E2E metrics (lead time and flow efficiency)
CREATE MATERIALIZED VIEW mv_deal_metrics AS
WITH majors AS (
  SELECT * FROM mv_major_stage_durations
), per_deal AS (
  SELECT deal_id,
         SUM(duration_seconds) AS total_stage_seconds
  FROM majors
  GROUP BY deal_id
), e2e AS (
  SELECT deal_id,
         MIN(entry_time) AS first_entry,
         MAX(exit_time)  AS last_exit
  FROM mv_major_stage_durations
  GROUP BY deal_id
)
SELECT e2e.deal_id,
       EXTRACT(EPOCH FROM (e2e.last_exit - e2e.first_entry))::BIGINT AS e2e_seconds,
       pd.total_stage_seconds,
       ROUND(100 * pd.total_stage_seconds::NUMERIC / NULLIF(EXTRACT(EPOCH FROM (e2e.last_exit - e2e.first_entry)),0), 2) AS flow_efficiency_pct
FROM e2e
JOIN per_deal pd ON e2e.deal_id = pd.deal_id;
```

---

## 4) API Routes

### 4.1 Ingestion
- **POST** `/api/integrations/pipedrive/final-stage`  
  Body: `{ deal_id, pipeline_id, stage_id, event_datetime, raw }`  
  Action: persist webhook payload, enqueue worker job.

- **Worker Job:**  
  1. Call Pipedrive `GET /deals/{deal_id}/flow`.  
  2. Extract stage_id changes with timestamps → insert into `pd_stage_events`.  
  3. Compute left_at by pairing successive entries.  
  4. Refresh materialised views.  

### 4.2 Admin Mapping
- **GET** `/api/admin/mappings?version=&active_on=&q=`  
- **POST** `/api/admin/mappings` (create draft)  
- **PATCH** `/api/admin/mappings/{id}` (update)  
- **POST** `/api/admin/mappings/{id}/publish`  
- **POST** `/api/admin/mappings/bulk-import`  
- **GET** `/api/admin/unmapped?from=&to=&version=`  
- **POST** `/api/admin/quick-map`  

### 4.3 Reporting
- **GET** `/api/flow/metrics?version=&from=&to=` → aggregated KPI metrics.  
- **GET** `/api/flow/deals?version=&from=&to=&owner=` → per-deal metrics.  
- **GET** `/api/flow/deals/{dealId}/timeline?version=` → canonicalised timeline with entry/exit timestamps.

---

## 5) UI Changes

### 5.1 Report Main Page
- KPI cards for each major stage. Shows Average, Best, Worst, Trend for selected period.  
- Period selector: 7d, 14d, 1m, 3m, 6m, 12m.
- Clicking “More Info” opens Detail View.

### 5.2 Detail View
- Summary tiles: Average, Best, Worst.  
- Table of deals: Deal ID (link to Pipedrive), Start Date, End Date, Duration.  
- Period selector to re-run report.  
- Highlight best/worst rows.  
- Edge case: empty state if no deals in range.

### 5.3 Mapping Version Management
- Manage mapping versions with effective dates.  
- Each canonical stage must have an entry and exit sub-stage mapped.  
- Cannot save new version until all canonical stages have mappings.  
- List of versions with history, ability to clone and edit.  
- Unmapped Events page with Quick Map action.

---

## 6) Incremental Cursor Prompts
- Migration: add canonical tables, stage boundaries, pd_stage_events, stage_map_scd.  
- Migration: add views for fn_canonical_events, mv_major_stage_durations, mv_deal_metrics.  
- API: implement ingestion, admin mapping, reporting.  
- UI: build Report Main Page, Detail View, and Mapping Management UI.  
- Add unmapped detector job.

---

## 7) Non-functional Considerations
- Security: HMAC on ingestion, role-based auth for admin endpoints.  
- Observability: structured JSON logs, ingest counters, view refresh metrics.  
- Performance: partitioning if >5k events/day.  
- Backfill: script to fetch flow history for closed deals.

---

## 8) Rollout Plan
1. Ship DB migrations + seeds.  
2. Implement ingestion route + worker; backfill last 90 days.  
3. Ship reporting endpoints.  
4. Add Report Main Page UI.  
5. Add Detail View.  
6. Add Admin Mapping UI.  
7. Iterate mappings with version v2.

---

*End of doc.*
