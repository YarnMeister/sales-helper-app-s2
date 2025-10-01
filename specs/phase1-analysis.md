# Phase 1 Analysis: Production Database Audit Results

**Date**: October 1, 2025  
**Status**: Analysis Complete  
**Branch**: `feature/migration-consolidation`

---

## Executive Summary

🚨 **CRITICAL FINDING**: Drizzle has **NEVER** managed your production database. Only the legacy migration system (`schema_migrations` table) has been used.

**Key Discoveries:**
1. ✅ Legacy system is active (18 migrations tracked)
2. ❌ Drizzle system has **NEVER** been used (`__drizzle_migrations` table doesn't exist)
3. ⚠️  **Significant schema drift** between production and `lib/database/schema.ts`
4. ⚠️  Missing tables defined in schema.ts
5. ⚠️  Missing indexes defined in schema.ts
6. ✅ All IDs are UUID-based (no sequences needed)

---

## Detailed Findings

### 1. Migration Tracking Status

**Legacy System (schema_migrations)**:
- ✅ Table EXISTS in production
- ✅ 18 migrations applied (version 1 through 18)
- ✅ Last migration: `flow_metrics_thresholds_and_comments` (Aug 29, 2025)
- ❌ Migrations 19-26 were never applied (these were the failing ones)

**Drizzle System (__drizzle_migrations)**:
- ❌ Table DOES NOT EXIST in production
- ❌ Drizzle has never run against this database
- ❌ All Drizzle migrations in `/lib/database/migrations/` and `/drizzle/` are orphaned

**Conclusion**: Production database was built entirely by legacy migrations.

---

### 2. Schema Drift Analysis

#### Tables in PRODUCTION but NOT in schema.ts:
✅ All production tables are defined in schema.ts (good!)

#### Tables in schema.ts but NOT in PRODUCTION:
1. ❌ `mock_requests` - Defined in schema.ts, doesn't exist in prod (expected, was dropped)
2. ❌ `flow_metrics` - Defined in schema.ts (lines 149-161), doesn't exist in prod
3. ❌ `kv_cache` - Defined in schema.ts (lines 163-173), doesn't exist in prod

#### Column Mismatches:

**`pipedrive_metric_data`** - MAJOR DIFFERENCES:
- **Production columns**:
  - `id` bigint (NOT NULL)
  - `title` text (NOT NULL)
  - `pipeline_id` bigint (NOT NULL)
  - `stage_id` bigint (NOT NULL)
  - `status` text (NOT NULL)
  - `first_fetched_at` timestamptz (DEFAULT now())
  - `last_fetched_at` timestamptz (DEFAULT now())

- **schema.ts columns** (lines 132-147):
  - `id` uuid (PRIMARY KEY, defaultRandom())
  - `dealId` integer (NOT NULL) ❌ MISSING IN PROD
  - `metricKey` text (NOT NULL) ❌ MISSING IN PROD
  - `startStageId` integer ❌ MISSING IN PROD
  - `endStageId` integer ❌ MISSING IN PROD
  - `startTimestamp` timestamp ❌ MISSING IN PROD
  - `endTimestamp` timestamp ❌ MISSING IN PROD
  - `durationDays` integer ❌ MISSING IN PROD
  - `createdAt` timestamp

**Conclusion**: `pipedrive_metric_data` in schema.ts is **completely wrong** - doesn't match production at all!

**`pipedrive_deal_flow_data`** - MISSING COLUMNS:
- Production has: `pipeline_id` (bigint, NOT NULL) ❌ NOT IN schema.ts
- Production has: `pipedrive_event_id` (bigint, NOT NULL) ❌ NOT IN schema.ts
- Production uses: `entered_at`, `left_at`, `duration_seconds` 
- schema.ts uses: `timestamp` (close match to `entered_at`)
- schema.ts has: `eventId` (text) but production has `pipedrive_event_id` (bigint)

**`pipedrive_submissions`** - NULLABILITY DIFFERENCE:
- Production: `simulated_deal_id` integer (NULLABLE)
- schema.ts: `simulatedDealId` integer (NOT NULL)

**`site_visits`** - MINOR DIFFERENCE:
- Production: `updated_at` column exists but has NO default
- schema.ts: `updatedAt` has `defaultNow()`

---

### 3. Missing Indexes

Production is **missing many indexes** defined in schema.ts:

**canonical_stage_mappings** - Missing:
- `idx_csm_canonical_stage`
- `idx_csm_start_stage`
- `idx_csm_end_stage`
- `idx_csm_start_stage_id`
- `idx_csm_end_stage_id`
- `idx_csm_metric_config_id`

**requests** - Missing:
- `idx_requests_request_id` (has unique constraint instead)
- `idx_requests_created_at`
- `idx_requests_status`
- `idx_requests_mine_group`
- `idx_requests_mine_name`
- `idx_requests_salesperson`
- `idx_requests_line_items_gin` (JSONB GIN index)
- `idx_requests_contact_gin` (JSONB GIN index)

**site_visits** - Missing:
- `idx_site_visits_date`
- `idx_site_visits_salesperson`
- `idx_site_visits_created_at`

**pipedrive_submissions** - Missing:
- `idx_pipedrive_submissions_request_id`
- `idx_pipedrive_submissions_simulated_deal_id`

**pipedrive_deal_flow_data** - Missing:
- `idx_pipedrive_deal_flow_data_deal_id`
- `idx_pipedrive_deal_flow_data_stage_id`
- `idx_pipedrive_deal_flow_data_timestamp`

**pipedrive_metric_data** - All indexes missing (because table structure is wrong)

**flow_metrics_config** - Missing:
- `idx_fmc_metric_key` (has unique constraint instead)
- `idx_fmc_sort_order`
- `idx_fmc_is_active`

---

### 4. Constraint Differences

**Check Constraints**:
- Production has MANY auto-generated NOT NULL check constraints (format: `2200_<oid>_<pos>_not_null`)
- These are noise - PostgreSQL internal implementation details
- Business logic constraints exist and match expectations:
  - `requests_salesperson_selection_check`
  - `check_salesperson_valid` (site_visits)
  - `check_purpose_valid` (site_visits)
  - `check_availability_valid` (site_visits)

**Foreign Keys**:
- Only ONE FK in production: `canonical_stage_mappings.metric_config_id` → `flow_metrics_config.id`
- schema.ts doesn't define this FK explicitly (it's inferred from relations)

---

### 5. Enum Types

✅ **Production has**: `request_status` enum with values: draft, submitted, approved, rejected  
✅ **schema.ts has**: `request_status` enum with values: draft, submitted, failed

⚠️  **MISMATCH**: 
- Production has: `approved`, `rejected`
- schema.ts has: `failed`

---

### 6. Custom Functions

Production has 6 custom functions:
1. `generate_mock_request_id()` - Uses `mock_request_id_seq` sequence
2. `generate_prod_request_id()` - Uses `prod_request_id_seq` sequence  
3. `generate_request_id()` - Manual sequence logic
4. `set_updated_at()` - Trigger function
5. `update_canonical_stage_mappings_updated_at()` - Trigger function
6. `validate_contact_jsonb()` - JSONB validation

⚠️  Functions reference sequences (`mock_request_id_seq`, `prod_request_id_seq`) but Query 11 showed **no sequences exist**. This suggests the sequences were dropped in migration 009 or 021.

---

## Root Cause Analysis

### Why is there so much drift?

1. **Drizzle was never used for production** - The schema.ts file was created/updated but never applied
2. **Legacy migrations were the source of truth** - All 18 migrations ran successfully
3. **schema.ts is aspirational** - It represents a desired future state, not current reality
4. **Recent feature work** - The `feature/flow-metrics-module` branch was adding new tables/features to schema.ts

### What happened with migrations 019-026?

Looking at production, the last applied migration is #18 (`flow_metrics_thresholds_and_comments`). Migrations 019-026 in `/migrations/` folder were created but:
- ❌ Migration 019: `ensure_pipedrive_submissions_schema` - NOT applied
- ❌ Migration 021: `master_cleanup_and_schema_rebuild` - NOT applied  
- ❌ Migrations 022-026: Flow metrics refactoring - NOT applied (these were the silent failures)

This means production is **stuck at migration 18**.

---

## Decision: What Path Forward?

Given these findings, we have **two options**:

### Option A: Drizzle from Scratch (RECOMMENDED)

**Goal**: Make Drizzle the source of truth going forward

**Steps**:
1. **Fix schema.ts** to match production exactly:
   - Remove `mock_requests`, `flow_metrics`, `kv_cache` tables
   - Fix `pipedrive_metric_data` structure to match production
   - Fix `pipedrive_deal_flow_data` to add missing columns
   - Fix `pipedrive_submissions` nullability
   - Fix `request_status` enum
   - Add all missing indexes

2. **Generate baseline Drizzle migration**:
   - Run `drizzle-kit generate` - should create migration representing current prod state
   - This becomes migration "0000"

3. **Initialize Drizzle tracking**:
   - Manually create `__drizzle_migrations` table in production
   - Mark baseline migration as "applied" without running it
   - Production already has the tables, we're just telling Drizzle "you're caught up"

4. **Clean up legacy system**:
   - Delete `/migrations/` folder (history preserved in git)
   - Delete legacy migration scripts
   - Update package.json
   - Remove `schema_migrations` table from schema.ts (but keep in prod for historical reference)

5. **Going forward**:
   - All schema changes go through Drizzle
   - `drizzle-kit generate` → review → `drizzle-kit push` or migrate

**Pros**:
- Clean break from problematic legacy system
- Drizzle becomes single source of truth
- schema.ts will always match production
- Industry standard approach

**Cons**:
- Requires fixing schema.ts first (30-60 min work)
- Need to carefully initialize Drizzle tracking
- Lose ability to rollback to pre-migration-18 states (acceptable)

---

### Option B: Hybrid Approach (NOT RECOMMENDED)

Apply missing legacy migrations (019-026) to production, then transition to Drizzle.

**Why NOT recommended**:
- These migrations already failed silently
- Would need to debug/fix migrate.js script
- Adds more risk
- Delays Drizzle adoption
- Migrations 022-026 don't align with current production anyway

---

## Recommendation

**Proceed with Option A: Drizzle from Scratch**

**Rationale**:
1. Legacy system has proven unreliable (migrations 022-026 silent failures)
2. Production is in a known, stable state (migration 18)
3. schema.ts is close to production - just needs corrections
4. This gives us a clean, maintainable path forward
5. Drizzle is the industry standard

**Risk Level**: **MEDIUM-LOW**
- Production database is not changing (just fixing schema.ts representation)
- Drizzle initialization is low-risk (just tracking metadata)
- Can test thoroughly in local/dev environment first

---

## Next Steps (Phase 2)

Following Option A, the next phase is:

### Phase 2: Fix schema.ts to Match Production

**Tasks**:
1. Remove tables that don't exist in production
2. Fix `pipedrive_metric_data` structure completely
3. Fix `pipedrive_deal_flow_data` columns
4. Fix `pipedrive_submissions` nullability
5. Fix `request_status` enum values
6. Add all missing indexes
7. Verify schema.ts matches production 100%

**Validation**:
- Run `drizzle-kit generate` - should show "No changes detected" (or just index additions)
- Compare generated migration with production schema manually

**Time estimate**: 1-2 hours

---

## Questions for User

Before proceeding to Phase 2:

1. **Confirm Option A** - Are you comfortable with Drizzle from scratch approach?
2. **Production backup** - Do you have a recent database backup?
3. **Mock tables** - The `mock_requests` table in schema.ts - was this intentionally kept for dev/testing?
4. **kv_cache table** - Was this planned for a future caching feature?
5. **flow_metrics table** - Is this distinct from `flow_metrics_config`? What was its purpose?

Once confirmed, I'll proceed with fixing schema.ts to match production exactly.

