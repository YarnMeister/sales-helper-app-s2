# WebSocket-Only Migration System - Implementation Plan

**Date:** October 2, 2025
**Status:** Ready for Implementation
**Principle:** One driver, one workflow, zero confusion.

---

## Executive Summary

This plan establishes a single, simple migration system using WebSocket driver exclusively:
- **One workflow:** Edit schema → Generate → Migrate
- **One location:** `lib/database/migrations/` (Drizzle-managed)
- **One driver:** WebSocket (supports all SQL scenarios)
- **Zero ambiguity:** No decisions about modes or drivers

---

## PHASE 1: ESTABLISH GROUND TRUTH (Schema Verification)

### Goal: 100% confidence that `schema.ts` matches production

### 1.1 Introspect Production Database

Run these SQL queries in production Neon SQL Editor and save results:

```sql
-- Query 1: All tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

Result:
#	table_name
1	__drizzle_migrations
2	flow_metrics_config
3	pipedrive_deal_flow_data
4	pipedrive_submissions
5	requests
6	schema_migrations
7	site_visits

-- Query 2: All columns with types
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

Result:
#	table_name	column_name	data_type	is_nullable	column_default
1	__drizzle_migrations	id	integer	NO	nextval('__drizzle_migrations_id_seq'::regclass)
2	__drizzle_migrations	hash	text	NO	
3	__drizzle_migrations	created_at	bigint	YES	
4	flow_metrics_config	id	integer	NO	nextval('flow_metrics_config_id_seq'::regclass)
5	flow_metrics_config	metric_key	text	NO	
6	flow_metrics_config	display_title	text	NO	
7	flow_metrics_config	config	jsonb	NO	'{}'::jsonb
8	flow_metrics_config	sort_order	integer	NO	0
9	flow_metrics_config	is_active	boolean	NO	true
10	flow_metrics_config	created_at	timestamp with time zone	NO	now()
11	flow_metrics_config	updated_at	timestamp with time zone	NO	now()
12	pipedrive_deal_flow_data	id	uuid	NO	gen_random_uuid()
13	pipedrive_deal_flow_data	deal_id	bigint	NO	
14	pipedrive_deal_flow_data	pipeline_id	bigint	NO	
15	pipedrive_deal_flow_data	stage_id	bigint	NO	
16	pipedrive_deal_flow_data	stage_name	text	NO	
17	pipedrive_deal_flow_data	entered_at	timestamp with time zone	NO	
18	pipedrive_deal_flow_data	left_at	timestamp with time zone	YES	
19	pipedrive_deal_flow_data	duration_seconds	bigint	YES	
20	pipedrive_deal_flow_data	created_at	timestamp with time zone	YES	now()
21	pipedrive_deal_flow_data	updated_at	timestamp with time zone	YES	now()
22	pipedrive_deal_flow_data	pipedrive_event_id	bigint	NO	
23	pipedrive_submissions	id	uuid	NO	gen_random_uuid()
24	pipedrive_submissions	request_id	text	NO	
25	pipedrive_submissions	payload	jsonb	NO	
26	pipedrive_submissions	simulated_deal_id	integer	YES	
27	pipedrive_submissions	created_at	timestamp with time zone	NO	now()
28	pipedrive_submissions	updated_at	timestamp with time zone	NO	now()
29	requests	id	uuid	NO	gen_random_uuid()
30	requests	request_id	text	YES	
31	requests	status	USER-DEFINED	NO	'draft'::request_status
32	requests	salesperson_first_name	text	YES	
33	requests	salesperson_selection	text	YES	
34	requests	mine_group	text	YES	
35	requests	mine_name	text	YES	
36	requests	contact	jsonb	YES	
37	requests	line_items	jsonb	NO	'[]'::jsonb
38	requests	comment	text	YES	
39	requests	pipedrive_deal_id	integer	YES	
40	requests	created_at	timestamp with time zone	NO	now()
41	requests	updated_at	timestamp with time zone	NO	now()
42	schema_migrations	version	integer	NO	
43	schema_migrations	name	text	NO	
44	schema_migrations	executed_at	timestamp with time zone	NO	now()
45	site_visits	id	uuid	NO	gen_random_uuid()
46	site_visits	date	date	NO	now()
47	site_visits	salesperson	text	NO	
48	site_visits	planned_mines	ARRAY	NO	
49	site_visits	main_purpose	text	NO	
50	site_visits	availability	text	NO	
51	site_visits	comments	text	YES	
52	site_visits	created_at	timestamp with time zone	YES	now()
53	site_visits	updated_at	timestamp with time zone	YES	now()


-- Query 3: All constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  pg_get_constraintdef(c.oid) as definition
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN pg_constraint c ON c.conname = tc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

Result:
#	table_name	constraint_name	constraint_type	column_name	definition
1	__drizzle_migrations	__drizzle_migrations_pkey	PRIMARY KEY	id	PRIMARY KEY (id)
2	__drizzle_migrations	__drizzle_migrations_pkey	PRIMARY KEY	id	PRIMARY KEY (id)
3	__drizzle_migrations	__drizzle_migrations_pkey	PRIMARY KEY	id	PRIMARY KEY (id)
4	__drizzle_migrations	__drizzle_migrations_pkey	PRIMARY KEY	id	PRIMARY KEY (id)
5	flow_metrics_config	flow_metrics_config_pkey	PRIMARY KEY	id	PRIMARY KEY (id)
6	flow_metrics_config	flow_metrics_config_metric_key_key	UNIQUE	metric_key	UNIQUE (metric_key)
7	pipedrive_deal_flow_data	pipedrive_deal_flow_data_pkey	PRIMARY KEY	id	PRIMARY KEY (id)
8	pipedrive_deal_flow_data	pipedrive_deal_flow_data_pipedrive_event_id_unique	UNIQUE	pipedrive_event_id	UNIQUE (pipedrive_event_id)
9	pipedrive_submissions	pipedrive_submissions_pkey	PRIMARY KEY	id	PRIMARY KEY (id)
10	requests	requests_pkey	PRIMARY KEY	id	PRIMARY KEY (id)
11	requests	requests_request_id_unique	UNIQUE	request_id	UNIQUE (request_id)
12	schema_migrations	schema_migrations_pkey	PRIMARY KEY	version	PRIMARY KEY (version)
13	site_visits	site_visits_pkey	PRIMARY KEY	id	PRIMARY KEY (id)


-- Query 4: All indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

Result:
#	schemaname	tablename	indexname	indexdef
1	public	__drizzle_migrations	__drizzle_migrations_pkey	CREATE UNIQUE INDEX __drizzle_migrations_pkey ON public.__drizzle_migrations USING btree (id)
2	public	flow_metrics_config	flow_metrics_config_metric_key_key	CREATE UNIQUE INDEX flow_metrics_config_metric_key_key ON public.flow_metrics_config USING btree (metric_key)
3	public	flow_metrics_config	flow_metrics_config_pkey	CREATE UNIQUE INDEX flow_metrics_config_pkey ON public.flow_metrics_config USING btree (id)
4	public	flow_metrics_config	idx_flow_metrics_config_gin	CREATE INDEX idx_flow_metrics_config_gin ON public.flow_metrics_config USING gin (config)
5	public	flow_metrics_config	idx_flow_metrics_config_is_active	CREATE INDEX idx_flow_metrics_config_is_active ON public.flow_metrics_config USING btree (is_active)
6	public	flow_metrics_config	idx_flow_metrics_config_metric_key	CREATE INDEX idx_flow_metrics_config_metric_key ON public.flow_metrics_config USING btree (metric_key)
7	public	flow_metrics_config	idx_flow_metrics_config_sort_order	CREATE INDEX idx_flow_metrics_config_sort_order ON public.flow_metrics_config USING btree (sort_order)
8	public	pipedrive_deal_flow_data	pipedrive_deal_flow_data_pipedrive_event_id_unique	CREATE UNIQUE INDEX pipedrive_deal_flow_data_pipedrive_event_id_unique ON public.pipedrive_deal_flow_data USING btree (pipedrive_event_id)
9	public	pipedrive_deal_flow_data	pipedrive_deal_flow_data_pkey	CREATE UNIQUE INDEX pipedrive_deal_flow_data_pkey ON public.pipedrive_deal_flow_data USING btree (id)
10	public	pipedrive_submissions	pipedrive_submissions_pkey	CREATE UNIQUE INDEX pipedrive_submissions_pkey ON public.pipedrive_submissions USING btree (id)
11	public	requests	requests_pkey	CREATE UNIQUE INDEX requests_pkey ON public.requests USING btree (id)
12	public	requests	requests_request_id_unique	CREATE UNIQUE INDEX requests_request_id_unique ON public.requests USING btree (request_id)
13	public	schema_migrations	schema_migrations_pkey	CREATE UNIQUE INDEX schema_migrations_pkey ON public.schema_migrations USING btree (version)
14	public	site_visits	site_visits_pkey	CREATE UNIQUE INDEX site_visits_pkey ON public.site_visits USING btree (id)


-- Query 5: All enums
SELECT
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

Result:
#	enum_name	enum_value
1	request_status	draft
2	request_status	submitted
3	request_status	approved
4	request_status	rejected

```

### 1.2 Create Schema Verification Script

**File:** `scripts/verify-schema-matches-production.ts`

Compares `lib/database/schema.ts` against production database.
Exits with error if any mismatches found.

### 1.3 Fix schema.ts to Match Production

Based on introspection results, manually update `lib/database/schema.ts`:
1. Remove tables that don't exist in production
2. Add tables that exist in production but not in schema.ts
3. Fix column types, constraints, indexes
4. Verify enums match

### 1.4 Verify Fix

```bash
npm run db:verify-schema
# Should output: ✅ schema.ts matches production database
```

**Success Criteria:**
- ✅ All production tables in schema.ts
- ✅ No extra tables in schema.ts
- ✅ Verification script passes
- ✅ 100% confidence in baseline

**Time Estimate:** 1 hour

---

## PHASE 2: ESTABLISH SINGLE SOURCE OF TRUTH (WebSocket + Drizzle Kit)

### Goal: `lib/database/migrations/` is THE ONLY place for migrations

### 2.1 Update Database Connection to WebSocket

**File:** `lib/database/connection-standard.ts`

Configure WebSocket for Neon (supports multi-statement SQL).

### 2.2 Update Drizzle Config

**File:** `drizzle.config.ts`

Point to `./lib/database/migrations` as SINGLE source of truth.

### 2.3 Create WebSocket Migration Runner

**File:** `scripts/migrate-websocket.ts`

Runs all pending migrations from `lib/database/migrations/` using WebSocket driver.

### 2.4 Update package.json Scripts

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx scripts/migrate-websocket.ts",
    "db:verify-schema": "tsx scripts/verify-schema-matches-production.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

### 2.5 Delete Legacy System

```bash
# Delete old migration folders
rm -rf migrations/

# Delete legacy scripts
rm scripts/unified-migrate.js
rm scripts/run-websocket-migrations.ts

# Keep only:
# - lib/database/migrations/ (Drizzle-managed)
# - scripts/migrate-websocket.ts (WebSocket runner)
# - scripts/verify-schema-matches-production.ts (Verification)
```

**Success Criteria:**
- ✅ Only ONE migrations folder: `lib/database/migrations/`
- ✅ WebSocket driver configured everywhere
- ✅ Drizzle Kit generates to correct location
- ✅ All legacy code deleted

**Time Estimate:** 1.5 hours



---

## PHASE 3: AUTOMATED GOVERNANCE (Pre-Deployment Checks)

### Goal: Lightweight automation ensures migrations are safe

### 3.1 Create Migration Validation Script

**File:** `scripts/validate-migrations.ts`

Pre-deployment migration validation checks:
1. Journal exists and is valid
2. All migrations have corresponding SQL files
3. No orphaned SQL files
4. Migrations are idempotent (basic checks)

### 3.2 Update Build Script

**File:** `package.json`

```json
{
  "scripts": {
    "prebuild": "npm run db:validate-migrations",
    "build": "npm run env:check && npm run db:migrate && next build",
    "db:validate-migrations": "tsx scripts/validate-migrations.ts"
  }
}
```

### 3.3 Add GitHub Actions Check

**File:** `.github/workflows/validate-migrations.yml`

Validates migrations on every PR that touches schema or migrations.

**Success Criteria:**
- ✅ Validation runs before every build
- ✅ Catches orphaned migrations
- ✅ Catches missing SQL files
- ✅ Warns about non-idempotent migrations
- ✅ CI fails if validation fails

**Time Estimate:** 1 hour

---

## PHASE 4: GUARDRAILS FOR AI ASSISTANTS

### Goal: Clear, enforceable rules in project config

### 4.1 Create Database Migration Rules

**File:** `.augment/rules/DATABASE_MIGRATIONS.md`

Complete migration workflow documentation:
- The One Rule: Always use Drizzle Kit with WebSocket
- 3-step workflow
- Pre-deployment checklist
- What NOT to do
- Troubleshooting guide
- AI assistant instructions

### 4.2 Update Project Config

**File:** `.augment/project-config.md`

Add migration system overview and checklist for new feature branches.

### 4.3 Add Pre-Commit Hook

**File:** `.husky/pre-commit`

Validates migrations when schema.ts changes.

**Success Criteria:**
- ✅ Clear rules in `.augment/rules/DATABASE_MIGRATIONS.md`
- ✅ Project config references migration rules
- ✅ Pre-commit hook validates migrations
- ✅ AI assistants have unambiguous guidance

**Time Estimate:** 30 minutes

---

## Implementation Timeline

```
Phase 1: Schema Verification          [1 hour]
  - Introspect production
  - Create verification script
  - Fix schema.ts
  - Verify match

Phase 2: WebSocket Migration System   [1.5 hours]
  - Update connection to WebSocket
  - Update drizzle.config.ts
  - Create migrate-websocket.ts
  - Delete legacy system
  - Test end-to-end

Phase 3: Automated Governance         [1 hour]
  - Create validation script
  - Update build process
  - Add GitHub Actions
  - Test validation

Phase 4: AI Guardrails                [30 minutes]
  - Create DATABASE_MIGRATIONS.md
  - Update project-config.md
  - Add pre-commit hook
  - Test workflow

TOTAL: 4 hours
```

---

## Success Criteria

### 1. 100% Schema Confidence
✅ Verification script confirms schema.ts matches production
✅ No manual SQL needed
✅ Automated check before every migration generation

### 2. Single Source of Truth
✅ Only `lib/database/migrations/` exists
✅ Drizzle journal is authoritative
✅ No orphaned migrations possible
✅ WebSocket driver handles all scenarios

### 3. Automated Governance
✅ Pre-build validation catches issues
✅ CI blocks PRs with invalid migrations
✅ Pre-commit hook prevents bad commits
✅ Clear error messages guide fixes

### 4. AI-Proof Guardrails
✅ One workflow documented in one place
✅ No ambiguity about when to use what
✅ Pre-commit hook enforces rules
✅ Project config is single source of truth

---

## The One Workflow (Post-Implementation)

```bash
# 1. Edit schema
vim lib/database/schema.ts

# 2. Generate migration
npm run db:generate

# 3. Apply migration
npm run db:migrate

# Done!
```

No decisions. No modes. No confusion.
