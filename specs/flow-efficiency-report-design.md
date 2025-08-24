# Sales Helper App — Flow Efficiency Tracking (Design)

**Status:** Draft v1  
**Owner:** Jan / Sales Helper Team  
**Date:** 2025‑08‑24 (AEST)

---

## 1) Objective
Build a resilient, low‑overhead capability to measure **lead times** and **flow efficiency** across the end‑to‑end (E2E) sales → provisioning lifecycle, while Pipedrive pipelines/stages change over time. The system must:

- Capture the *facts* of stage transitions and provisioning milestones (immutable history).
- Translate changing Pipedrive pipeline/stage IDs into a **stable canonical model** (major stages + sub‑stages) using a versioned, effective‑dated mapping layer.
- Compute lead time per lifecycle step and overall flow efficiency (value‑add time ÷ total time).
- Provide simple admin tooling (mapping changes, unmapped detector) and analytic views for dashboards.
- Operate reliably at **10–50 events/day** with headroom.

---

## 2) Functional Components

### 2.1 Event Ingestion
- **Trigger:** When a deal hits the **final stage**, Zapier posts to the app; backend then calls Pipedrive `GET /deals/{id}/flow` to fetch the **full stage history** once per completed deal (low noise, high fidelity).  
- **Future (optional):** Add more webhooks (e.g., any stage change; internal provisioning milestones) if near‑real‑time is needed.

### 2.2 Canonical Lifecycle Model (stable)
- **Major stages (fixed):** LEAD, QUOTE, ORDER, PROCUREMENT, MFG, DELIVERY, PAYMENT.  
- **Sub‑stages (stable keys):** e.g., `LEAD.GENERATED`, `LEAD.BUDGET_SENT`, `LEAD.RFQ_RECEIVED`, `QUOTE.SENT`, `ORDER.RECEIVED`, `PROC.SUPPLIER_ORDER_PLACED`, `MFG.STARTED`, `MFG.COMPLETED`, `DELIVERY.SCHEDULED`, `DELIVERY.PAPERWORK_PROCESSED`, `PAYMENT.RECEIVED`, etc.  
- Each sub‑stage has `is_value_add` and `sort_order`.

### 2.3 Translation Layer (versioned, effective‑dated)
- **Goal:** Decouple volatile Pipedrive IDs from stable canonical sub‑stages.  
- **Mechanism:** SCD2 table mapping `(pipeline_id, stage_id)` → `sub_key` with `effective_from`, `effective_to`, and `report_version`.  
- **Outcome:** Reports can be re‑run under any `report_version`; events always join to the mapping that was valid **at the time**.

### 2.4 Analytics & Reporting
- Compute **durations** per sub‑stage by pairing each entry time with the next entry time.  
- Roll up to **major stage** durations and **E2E lead time**.  
- **Flow efficiency:** sum of durations for `is_value_add = true` ÷ E2E total time.  
- Provide materialised views for fast dashboards and a detector for **unmapped events**.

### 2.5 Admin UX (essential)
- Manage mappings (CRUD) with validation, draft vs published (`report_version`).  
- Impact Simulator: preview mapping changes against a sample of deals.  
- Unmapped Events list with "Quick Map" action.

---

## 3) Neon DB Changes

> Naming assumes Supabase/Neon Postgres. All timestamps UTC.

### 3.1 Canonical Dictionaries
```sql
CREATE TABLE canonical_major_stage_dim (
  major_key   TEXT PRIMARY KEY,      -- 'LEAD','QUOTE','ORDER','PROCUREMENT','MFG','DELIVERY','PAYMENT'
  display_name TEXT NOT NULL,
  sort_order   INT  NOT NULL
);

CREATE TABLE canonical_substage_dim (
  sub_key      TEXT PRIMARY KEY,     -- 'LEAD.GENERATED', 'QUOTE.SENT', ...
  major_key    TEXT NOT NULL REFERENCES canonical_major_stage_dim(major_key),
  display_name TEXT NOT NULL,
  sort_order   INT  NOT NULL,
  is_value_add BOOLEAN NOT NULL DEFAULT FALSE
);
```

### 3.2 Immutable Raw Events (from Pipedrive flow pull)
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

-- Stage durations (seconds) per deal/sub-stage (MV recommended)
CREATE MATERIALIZED VIEW mv_substage_durations AS
WITH canon AS (
  SELECT * FROM fn_canonical_events(1)
), ord AS (
  SELECT deal_id, sub_key, entered_at,
         LEAD(entered_at) OVER (PARTITION BY deal_id ORDER BY entered_at) AS next_entered,
         left_at
  FROM canon
)
SELECT deal_id, sub_key,
       EXTRACT(EPOCH FROM (COALESCE(next_entered, left_at, now()) - entered_at))::BIGINT AS seconds_in_substage
FROM ord;

-- E2E metrics (lead time, value-add, efficiency)
CREATE MATERIALIZED VIEW mv_deal_metrics AS
WITH canon AS (
  SELECT * FROM fn_canonical_events(1)
), bounds AS (
  SELECT deal_id,
         MIN(entered_at) FILTER (WHERE sub_key LIKE 'LEAD.%')    AS first_at,
         MAX(COALESCE(left_at, now())) FILTER (WHERE sub_key = 'PAYMENT.RECEIVED') AS last_at
  FROM canon
  GROUP BY deal_id
), value_add AS (
  SELECT c.deal_id,
         SUM(EXTRACT(EPOCH FROM (COALESCE(c.left_at, now()) - c.entered_at)))::BIGINT AS va_seconds
  FROM canon c
  JOIN canonical_substage_dim d USING (sub_key)
  WHERE d.is_value_add
  GROUP BY c.deal_id
)
SELECT b.deal_id,
       EXTRACT(EPOCH FROM (b.last_at - b.first_at))::BIGINT AS e2e_seconds,
       va.va_seconds,
       ROUND(100 * va.va_seconds::NUMERIC / NULLIF(EXTRACT(EPOCH FROM (b.last_at - b.first_at)),0), 2) AS flow_efficiency_pct
FROM bounds b LEFT JOIN value_add va USING (deal_id)
WHERE b.first_at IS NOT NULL AND b.last_at IS NOT NULL;
```

> Refresh policy: cron every 15–60 min, or on-demand after ingestion jobs complete.

### 3.5 Data Quality & Alerts
```sql
-- Unmapped events detector (daily)
SELECT e.pipeline_id, e.stage_id, COUNT(*) AS cnt
FROM pd_stage_events e
LEFT JOIN stage_map_scd m
  ON m.source_system = 'pipedrive'
 AND m.pipeline_id = e.pipeline_id
 AND m.stage_id = e.stage_id
 AND m.effective_from <= e.entered_at
 AND (m.effective_to IS NULL OR e.entered_at < m.effective_to)
WHERE m.map_id IS NULL
GROUP BY 1,2
ORDER BY cnt DESC;
```

---

## 4) New API Routes

### 4.1 Ingestion
- **POST** `/api/integrations/pipedrive/final-stage`  
  **Body:** `{ deal_id, pipeline_id, stage_id, event_datetime, raw }`  
  **Auth:** shared secret / HMAC header.  
  **Action:** persist raw webhook, enqueue job.

- **Worker job (server)**  
  **Steps:**
  1) Call Pipedrive `GET /deals/{deal_id}/flow`.
  2) Extract `stage_id` changes with timestamps → write `pd_stage_events` (compute `left_at`).
  3) Refresh MVs (or mark for next scheduled refresh).
  4) Log metrics; handle rate limits with backoff.

### 4.2 Admin Mapping
- **GET** `/api/admin/mappings?version=&active_on=&q=`
- **POST** `/api/admin/mappings` (create draft)
- **PATCH** `/api/admin/mappings/{id}` (update)
- **POST** `/api/admin/mappings/{id}/publish` (close/open windows, bump `report_version`)
- **POST** `/api/admin/mappings/bulk-import` (CSV/JSON)
- **GET** `/api/admin/unmapped?from=&to=&version=`
- **POST** `/api/admin/quick-map` `{ pipeline_id, stage_id, sub_key, effective_from, effective_to, report_version }`

### 4.3 Reporting
- **GET** `/api/flow/metrics?version=1&from=2025-07-01&to=2025-08-24`  
  Returns KPI cards: lead times per major, E2E lead time, flow efficiency.
- **GET** `/api/flow/deals?version=1&from=&to=&owner=`  
  Returns per‑deal metrics (join to `mv_deal_metrics`).
- **GET** `/api/flow/deals/{dealId}/timeline?version=1`  
  Returns canonicalised timeline (major + sub‑stages with durations).

> All GETs accept `version` param to render under a chosen mapping.

---

## 5) UI Changes

### 5.1 Flow Metrics Dashboard (mobile‑first)
- **KPI cards:** Lead Conversion, Quote Conversion, Order Conversion, Procurement, MFG, Delivery, Payment; E2E; Flow Efficiency %.  
- **Charts:**
  - Column chart: average days per major stage (filterable by owner/date range).
  - Trend: E2E lead time rolling median.
  - Funnel: stage progression counts.
- **Filters:** date range, salesperson, pipeline; **Report Version** selector.

### 5.2 Deal Timeline (detail)
- Vertical stepper of majors → nested sub‑stages.  
- Shows entry time, computed duration from previous step, and whether value‑add.
- Actions: "Refresh from Pipedrive", "Export CSV".

### 5.3 Admin — Translation Layer
- **Mapping Overview**: virtualised table, Draft/Active/Expired chips, bulk import/export.
- **Mapping Editor**: effective dates, report_version, validations (no overlaps).
- **Impact Simulator**: run mapping against sample deals (Resolved/Unmapped counts).
- **Unmapped Events**: grouped by (pipeline, stage) with Quick Map side panel.

---

## 6) Incremental Cursor Prompts (copy‑paste into Cursor)

> Use these one‑by‑one. If the previous step completed successfully, proceed; if there were any issues, ignore the next instruction.

### Prompt 1 — DB: Canonical & Mapping DDL
```
Create a migration that adds:
1) canonical_major_stage_dim, canonical_substage_dim tables (with seeds for our majors/sub‑stages; mark is_value_add appropriately),
2) pd_stage_events table with indexes,
3) stage_map_scd table with indexes.
Ensure all timestamps are TIMESTAMPTZ (UTC). Provide SQL in /supabase/migrations with an idempotent check.
```

### Prompt 2 — DB: Views & Materialised Views
```
Add a migration that creates:
- fn_canonical_events(report_version INT),
- mv_substage_durations,
- mv_deal_metrics,
plus a SQL function or cron to refresh materialised views. Return the SQL and wire a daily and on‑demand refresh.
```

### Prompt 3 — API: Ingestion Route & Worker
```
Add POST /api/integrations/pipedrive/final-stage with HMAC verification and idempotency. On success, call a server worker that fetches GET /deals/{deal_id}/flow, extracts stage transitions, writes pd_stage_events, sets left_at by pairing entries, and triggers MV refresh. Include unit tests and error handling/backoff.
```

### Prompt 4 — API: Admin Mapping CRUD
```
Implement admin endpoints:
GET /api/admin/mappings, POST /api/admin/mappings, PATCH /api/admin/mappings/{id}, POST /api/admin/mappings/{id}/publish, POST /api/admin/mappings/bulk-import, GET /api/admin/unmapped, POST /api/admin/quick-map. Validate no overlapping effective windows for the same (pipeline_id, stage_id, report_version).
```

### Prompt 5 — API: Reporting
```
Create reporting endpoints:
- GET /api/flow/metrics (aggregated KPI cards using mv_deal_metrics),
- GET /api/flow/deals (per‑deal table from mv_deal_metrics),
- GET /api/flow/deals/{dealId}/timeline (canonical events from fn_canonical_events).
Add query params: version, from, to, owner. Include pagination and caching headers.
```

### Prompt 6 — UI: Dashboard & Timeline
```
Build UI pages:
1) /flow/dashboard with KPI cards, version/date filters, and charts (column, trend, funnel),
2) /flow/deals/[dealId] timeline with vertical stepper of major/sub‑stages, durations, and actions (refresh/export).
Follow our mobile‑first card style and avoid exposing raw IDs.
```

### Prompt 7 — UI: Admin Mapping
```
Create an admin area with:
- Mapping Overview table (virtualised, filters, badges),
- Mapping Editor (slide‑over with effective dates, report_version),
- Impact Simulator (what‑if evaluation against sample deals),
- Unmapped Events page with Quick Map side panel.
Secure behind admin role.
```

### Prompt 8 — DQ & Alerts
```
Add a scheduled job that runs the "unmapped events" SQL daily and posts to Slack if any counts > 0. Include a manual admin button to re‑run the check and view results in the UI.
```

---

## 7) Non‑functional Considerations
- **Security:** shared secret/HMAC for Zapier; IP allowlist optional. Admin endpoints protected; audit mapping changes with `change_note` and user id.
- **Observability:** structured logs (request_id, deal_id, version), counters (ingest_success/failure), p95 ingest latency, MV refresh duration.
- **Performance:** volumes are tiny; indexes are hygiene. If growth >5k events/day, consider monthly partitioning on `pd_stage_events`.
- **Backfill:** one‑off script to iterate closed deals and pull `flow`; idempotent writes.

---

## 8) Rollout Plan
1) Ship DB migrations + seeds for canon and initial mapping (v1).  
2) Implement ingestion route + worker; backfill last 90 days.  
3) Ship reporting endpoints + simple dashboard.  
4) Add Admin Mapping UI + unmapped detector.  
5) Iterate on value‑add flags and Report Version v2 for interpretation improvements.

---

*End of doc.*

