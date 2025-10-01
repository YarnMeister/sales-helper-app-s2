# Phase 1: Production Database Audit

**Date**: October 1, 2025  
**Status**: In Progress  
**Branch**: `feature/migration-consolidation`

---

## Instructions

Run each query below against your **production database** and paste the results in the `**RESULTS:**` section under each query. If a query returns an error, note the error message.

---

## Query 1: Check Migration Tracking Tables

### 1a. Check if schema_migrations exists

```sql
-- Check if schema_migrations table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'schema_migrations'
) as schema_migrations_exists;
```

**RESULTS:**
```
#	schema_migrations_exists
1	t
```

---

### 1b. Check if __drizzle_migrations exists

```sql
-- Check if __drizzle_migrations table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = '__drizzle_migrations'
) as drizzle_migrations_exists;
```

**RESULTS:**
```
#	drizzle_migrations_exists
1	f
```

---

### 1c. Get all records from schema_migrations

```sql
-- Get all records from schema_migrations (if exists)
SELECT version, name, executed_at 
FROM schema_migrations 
ORDER BY version;
```

**RESULTS:**
```
#	version	name	executed_at
1	1	initial_schema	2025-08-16 04:47:55.59324+00
2	2	support_tables	2025-08-26 12:50:30.135167+00
3	3	database_functions	2025-08-16 06:53:22.38067+00
4	4	site_visits_table	2025-08-17 13:21:22.881262+00
5	5	add_submit_mode_to_site_visits	2025-08-18 02:29:49.382772+00
6	6	fix_submit_mode_column	2025-08-18 04:13:29.551198+00
7	7	create_mock_tables	2025-08-18 11:07:58.61916+00
8	8	import_legacy_site_visits_data	2025-08-19 06:16:11.965922+00
9	9	fix_site_visits_import	2025-08-19 06:18:37.76537+00
10	10	import_legacy_site_visits_to_production	2025-08-19 06:29:36.486065+00
11	11	separate_sequences_for_prod_and_mock	2025-08-20 12:28:54.222725+00
12	12	pipedrive_flow_data	2025-08-25 12:25:54.122319+00
13	13	add_pipedrive_event_id	2025-08-25 12:43:03.172704+00
14	14	fix_pipedrive_event_id	2025-08-25 12:45:18.18932+00
15	15	canonical_stage_mappings	2025-08-25 13:30:47.934681+00
16	16	enhanced_canonical_stages_data_modeling	2025-08-26 01:29:11.266632+00
17	17	stage_id_mappings	2025-08-26 12:39:22.227116+00
18	18	flow_metrics_thresholds_and_comments	2025-08-29 13:14:13.930238+00
```

---

### 1d. Get all records from __drizzle_migrations

```sql
-- Get all records from __drizzle_migrations (if exists)
SELECT id, hash, created_at 
FROM __drizzle_migrations 
ORDER BY created_at;
```

**RESULTS:**
```
ERROR: relation "__drizzle_migrations" does not exist (SQLSTATE 42P01)
SELECT id, hash, created_at 
FROM __drizzle_migrations 
ORDER BY created_at
```

---

## Query 2: List All Tables

```sql
-- Get all tables in public schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**RESULTS:**
```
#	table_name	table_type
1	canonical_stage_mappings	BASE TABLE
2	flow_metrics_config	BASE TABLE
3	pipedrive_deal_flow_data	BASE TABLE
4	pipedrive_metric_data	BASE TABLE
5	pipedrive_submissions	BASE TABLE
6	requests	BASE TABLE
7	schema_migrations	BASE TABLE
8	site_visits	BASE TABLE
```

---

## Query 3: Get Complete Table Schemas

```sql
-- Get all columns for all tables with their types and constraints
SELECT 
  t.table_name,
  c.column_name,
  c.ordinal_position,
  c.data_type,
  c.character_maximum_length,
  c.is_nullable,
  c.column_default,
  c.udt_name
FROM information_schema.tables t
JOIN information_schema.columns c 
  ON t.table_name = c.table_name 
  AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;
```

**RESULTS:**
```
#	table_name	column_name	ordinal_position	data_type	character_maximum_length	is_nullable	column_default	udt_name
1	canonical_stage_mappings	id	1	uuid		NO	gen_random_uuid()	uuid
2	canonical_stage_mappings	canonical_stage	2	text		NO		text
3	canonical_stage_mappings	start_stage	3	text		YES		text
4	canonical_stage_mappings	end_stage	4	text		YES		text
5	canonical_stage_mappings	created_at	5	timestamp with time zone		YES	now()	timestamptz
6	canonical_stage_mappings	updated_at	6	timestamp with time zone		YES	now()	timestamptz
7	canonical_stage_mappings	metric_config_id	7	uuid		YES		uuid
8	canonical_stage_mappings	start_stage_id	8	bigint		YES		int8
9	canonical_stage_mappings	end_stage_id	9	bigint		YES		int8
10	canonical_stage_mappings	avg_min_days	10	integer		YES		int4
11	canonical_stage_mappings	avg_max_days	11	integer		YES		int4
12	canonical_stage_mappings	metric_comment	12	text		YES		text
13	flow_metrics_config	id	1	uuid		NO	gen_random_uuid()	uuid
14	flow_metrics_config	metric_key	2	text		NO		text
15	flow_metrics_config	display_title	3	text		NO		text
16	flow_metrics_config	canonical_stage	4	text		NO		text
17	flow_metrics_config	sort_order	5	integer		NO	0	int4
18	flow_metrics_config	is_active	6	boolean		NO	true	bool
19	flow_metrics_config	created_at	7	timestamp with time zone		YES	now()	timestamptz
20	flow_metrics_config	updated_at	8	timestamp with time zone		YES	now()	timestamptz
21	pipedrive_deal_flow_data	id	1	uuid		NO	gen_random_uuid()	uuid
22	pipedrive_deal_flow_data	deal_id	2	bigint		NO		int8
23	pipedrive_deal_flow_data	pipeline_id	3	bigint		NO		int8
24	pipedrive_deal_flow_data	stage_id	4	bigint		NO		int8
25	pipedrive_deal_flow_data	stage_name	5	text		NO		text
26	pipedrive_deal_flow_data	entered_at	6	timestamp with time zone		NO		timestamptz
27	pipedrive_deal_flow_data	left_at	7	timestamp with time zone		YES		timestamptz
28	pipedrive_deal_flow_data	duration_seconds	8	bigint		YES		int8
29	pipedrive_deal_flow_data	created_at	9	timestamp with time zone		YES	now()	timestamptz
30	pipedrive_deal_flow_data	updated_at	10	timestamp with time zone		YES	now()	timestamptz
31	pipedrive_deal_flow_data	pipedrive_event_id	11	bigint		NO		int8
32	pipedrive_metric_data	id	1	bigint		NO		int8
33	pipedrive_metric_data	title	2	text		NO		text
34	pipedrive_metric_data	pipeline_id	3	bigint		NO		int8
35	pipedrive_metric_data	stage_id	4	bigint		NO		int8
36	pipedrive_metric_data	status	5	text		NO		text
37	pipedrive_metric_data	first_fetched_at	6	timestamp with time zone		YES	now()	timestamptz
38	pipedrive_metric_data	last_fetched_at	7	timestamp with time zone		YES	now()	timestamptz
39	pipedrive_submissions	id	1	uuid		NO	gen_random_uuid()	uuid
40	pipedrive_submissions	request_id	2	text		NO		text
41	pipedrive_submissions	payload	3	jsonb		NO		jsonb
42	pipedrive_submissions	simulated_deal_id	4	integer		YES		int4
43	pipedrive_submissions	created_at	5	timestamp with time zone		NO	now()	timestamptz
44	pipedrive_submissions	updated_at	6	timestamp with time zone		NO	now()	timestamptz
45	requests	id	1	uuid		NO	gen_random_uuid()	uuid
46	requests	request_id	2	text		YES		text
47	requests	status	3	USER-DEFINED		NO	'draft'::request_status	request_status
48	requests	salesperson_first_name	4	text		YES		text
49	requests	salesperson_selection	5	text		YES		text
50	requests	mine_group	6	text		YES		text
51	requests	mine_name	7	text		YES		text
52	requests	contact	8	jsonb		YES		jsonb
53	requests	line_items	9	jsonb		NO	'[]'::jsonb	jsonb
54	requests	comment	10	text		YES		text
55	requests	pipedrive_deal_id	11	integer		YES		int4
56	requests	created_at	12	timestamp with time zone		NO	now()	timestamptz
57	requests	updated_at	13	timestamp with time zone		NO	now()	timestamptz
58	schema_migrations	version	1	integer		NO		int4
59	schema_migrations	name	2	text		NO		text
60	schema_migrations	executed_at	3	timestamp with time zone		NO	now()	timestamptz
61	site_visits	id	1	uuid		NO	gen_random_uuid()	uuid
62	site_visits	date	2	date		NO	now()	date
63	site_visits	salesperson	3	text		NO		text
64	site_visits	planned_mines	4	ARRAY		NO		_text
65	site_visits	main_purpose	5	text		NO		text
66	site_visits	availability	6	text		NO		text
67	site_visits	comments	7	text		YES		text
68	site_visits	created_at	8	timestamp with time zone		YES	now()	timestamptz
69	site_visits	updated_at	9	timestamp with time zone	
```

---

## Query 4: Get Primary Keys

```sql
-- Get all primary key constraints
SELECT 
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.ordinal_position;
```

**RESULTS:**
```
#	table_name	column_name	constraint_name
1	canonical_stage_mappings	id	canonical_stage_mappings_pkey
2	flow_metrics_config	id	flow_metrics_config_pkey
3	pipedrive_deal_flow_data	id	pipedrive_deal_flow_data_pkey
4	pipedrive_metric_data	id	pipedrive_metric_data_pkey
5	pipedrive_submissions	id	pipedrive_submissions_pkey
6	requests	id	requests_pkey
7	schema_migrations	version	schema_migrations_pkey
8	site_visits	id	site_visits_pkey
```

---

## Query 5: Get Foreign Keys

```sql
-- Get all foreign key constraints
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

**RESULTS:**
```
#	table_name	column_name	foreign_table_name	foreign_column_name	constraint_name
1	canonical_stage_mappings	metric_config_id	flow_metrics_config	id	canonical_stage_mappings_metric_config_id_flow_metrics_config_i
```

---

## Query 6: Get Unique Constraints

```sql
-- Get all unique constraints
SELECT 
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

**RESULTS:**
```
#	table_name	column_name	constraint_name
1	flow_metrics_config	metric_key	flow_metrics_config_metric_key_unique
2	pipedrive_deal_flow_data	pipedrive_event_id	pipedrive_deal_flow_data_pipedrive_event_id_unique
3	requests	request_id	requests_request_id_unique

```

---

## Query 7: Get Check Constraints

```sql
-- Get all check constraints (including JSONB validation)
SELECT 
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

**RESULTS:**
```
#	table_name	constraint_name	check_clause
1	canonical_stage_mappings	2200_90112_2_not_null	canonical_stage IS NOT NULL
2	canonical_stage_mappings	2200_90112_1_not_null	id IS NOT NULL
3	flow_metrics_config	2200_98304_4_not_null	canonical_stage IS NOT NULL
4	flow_metrics_config	2200_98304_3_not_null	display_title IS NOT NULL
5	flow_metrics_config	2200_98304_6_not_null	is_active IS NOT NULL
6	flow_metrics_config	2200_98304_1_not_null	id IS NOT NULL
7	flow_metrics_config	2200_98304_2_not_null	metric_key IS NOT NULL
8	flow_metrics_config	2200_98304_5_not_null	sort_order IS NOT NULL
9	pipedrive_deal_flow_data	2200_81920_6_not_null	entered_at IS NOT NULL
10	pipedrive_deal_flow_data	2200_81920_3_not_null	pipeline_id IS NOT NULL
11	pipedrive_deal_flow_data	2200_81920_1_not_null	id IS NOT NULL
12	pipedrive_deal_flow_data	2200_81920_2_not_null	deal_id IS NOT NULL
13	pipedrive_deal_flow_data	2200_81920_11_not_null	pipedrive_event_id IS NOT NULL
14	pipedrive_deal_flow_data	2200_81920_4_not_null	stage_id IS NOT NULL
15	pipedrive_deal_flow_data	2200_81920_5_not_null	stage_name IS NOT NULL
16	pipedrive_metric_data	2200_81930_1_not_null	id IS NOT NULL
17	pipedrive_metric_data	2200_81930_3_not_null	pipeline_id IS NOT NULL
18	pipedrive_metric_data	2200_81930_4_not_null	stage_id IS NOT NULL
19	pipedrive_metric_data	2200_81930_5_not_null	status IS NOT NULL
20	pipedrive_metric_data	2200_81930_2_not_null	title IS NOT NULL
21	pipedrive_submissions	2200_188416_1_not_null	id IS NOT NULL
22	pipedrive_submissions	2200_188416_6_not_null	updated_at IS NOT NULL
23	pipedrive_submissions	2200_188416_5_not_null	created_at IS NOT NULL
24	pipedrive_submissions	2200_188416_3_not_null	payload IS NOT NULL
25	pipedrive_submissions	2200_188416_2_not_null	request_id IS NOT NULL
26	requests	requests_salesperson_selection_check	(salesperson_selection = ANY (ARRAY['Luyanda'::text, 'James'::text, 'Stefan'::text]))
27	requests	2200_24615_1_not_null	id IS NOT NULL
28	requests	2200_24615_3_not_null	status IS NOT NULL
29	requests	2200_24615_9_not_null	line_items IS NOT NULL
30	requests	2200_24615_12_not_null	created_at IS NOT NULL
31	requests	2200_24615_13_not_null	updated_at IS NOT NULL
32	schema_migrations	2200_24576_3_not_null	executed_at IS NOT NULL
33	schema_migrations	2200_24576_2_not_null	name IS NOT NULL
34	schema_migrations	2200_24576_1_not_null	version IS NOT NULL
35	site_visits	check_salesperson_valid	(salesperson = ANY (ARRAY['James'::text, 'Luyanda'::text, 'Stefan'::text]))
36	site_visits	check_purpose_valid	(main_purpose = ANY (ARRAY['Quote follow-up'::text, 'Delivery'::text, 'Site check'::text, 'Installation support'::text, 'General sales visit'::text]))
37	site_visits	check_availability_valid	(availability = ANY (ARRAY['Later this morning'::text, 'In the afternoon'::text, 'Tomorrow'::text]))
38	site_visits	2200_40960_1_not_null	id IS NOT NULL
39	site_visits	2200_40960_2_not_null	date IS NOT NULL
40	site_visits	2200_40960_3_not_null	salesperson IS NOT NULL
41	site_visits	2200_40960_4_not_null	planned_mines IS NOT NULL
42	site_visits	2200_40960_5_not_null	main_purpose IS NOT NULL
43	site_visits	2200_40960_6_not_null	availability IS NOT NULL

```

---

## Query 8: Get All Indexes

```sql
-- Get all indexes (including GIN indexes for JSONB)
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**RESULTS:**
```
#	schemaname	tablename	indexname	indexdef
1	public	canonical_stage_mappings	canonical_stage_mappings_pkey	CREATE UNIQUE INDEX canonical_stage_mappings_pkey ON public.canonical_stage_mappings USING btree (id)
2	public	flow_metrics_config	flow_metrics_config_metric_key_unique	CREATE UNIQUE INDEX flow_metrics_config_metric_key_unique ON public.flow_metrics_config USING btree (metric_key)
3	public	flow_metrics_config	flow_metrics_config_pkey	CREATE UNIQUE INDEX flow_metrics_config_pkey ON public.flow_metrics_config USING btree (id)
4	public	pipedrive_deal_flow_data	pipedrive_deal_flow_data_pipedrive_event_id_unique	CREATE UNIQUE INDEX pipedrive_deal_flow_data_pipedrive_event_id_unique ON public.pipedrive_deal_flow_data USING btree (pipedrive_event_id)
5	public	pipedrive_deal_flow_data	pipedrive_deal_flow_data_pkey	CREATE UNIQUE INDEX pipedrive_deal_flow_data_pkey ON public.pipedrive_deal_flow_data USING btree (id)
6	public	pipedrive_metric_data	pipedrive_metric_data_pkey	CREATE UNIQUE INDEX pipedrive_metric_data_pkey ON public.pipedrive_metric_data USING btree (id)
7	public	pipedrive_submissions	pipedrive_submissions_pkey	CREATE UNIQUE INDEX pipedrive_submissions_pkey ON public.pipedrive_submissions USING btree (id)
8	public	requests	requests_pkey	CREATE UNIQUE INDEX requests_pkey ON public.requests USING btree (id)
9	public	requests	requests_request_id_unique	CREATE UNIQUE INDEX requests_request_id_unique ON public.requests USING btree (request_id)
10	public	schema_migrations	schema_migrations_pkey	CREATE UNIQUE INDEX schema_migrations_pkey ON public.schema_migrations USING btree (version)
11	public	site_visits	site_visits_pkey	CREATE UNIQUE INDEX site_visits_pkey ON public.site_visits USING btree (id)



```

---

## Query 9: Get Custom Types (Enums)

```sql
-- Get all custom types (like request_status enum)
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value,
  e.enumsortorder
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY t.typname, e.enumsortorder;
```

**RESULTS:**
```
#	enum_name	enum_value	enumsortorder
1	request_status	draft	1
2	request_status	submitted	2
3	request_status	approved	3
4	request_status	rejected	4

```

---

## Query 10: Get Custom Functions

```sql
-- Get all custom functions (like validate_metric_config_jsonb)
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;
```

**RESULTS:**
```
#	schema_name	function_name	function_definition
1	public	generate_mock_request_id	CREATE OR REPLACE FUNCTION public.generate_mock_request_id() RETURNS text LANGUAGE plpgsql AS $function$ DECLARE next_num INTEGER; BEGIN SELECT nextval('mock_request_id_seq') INTO next_num; RETURN 'QR-' || LPAD(next_num::TEXT, 3, '0'); END; $function$
2	public	generate_prod_request_id	CREATE OR REPLACE FUNCTION public.generate_prod_request_id() RETURNS text LANGUAGE plpgsql AS $function$ DECLARE next_num INTEGER; BEGIN SELECT nextval('prod_request_id_seq') INTO next_num; RETURN 'QR-' || LPAD(next_num::TEXT, 3, '0'); END; $function$
3	public	generate_request_id	CREATE OR REPLACE FUNCTION public.generate_request_id() RETURNS text LANGUAGE plpgsql AS $function$ DECLARE next_num INTEGER; BEGIN SELECT COALESCE(MAX(CAST(SUBSTRING(request_id FROM 4) AS INTEGER)), 0) + 1 INTO next_num FROM requests WHERE request_id ~ '^QR-[0-9]+$'; RETURN 'QR-' || LPAD(next_num::TEXT, 3, '0'); END; $function$
4	public	set_updated_at	CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$
5	public	update_canonical_stage_mappings_updated_at	CREATE OR REPLACE FUNCTION public.update_canonical_stage_mappings_updated_at() RETURNS trigger LANGUAGE plpgsql AS $function$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $function$
6	public	validate_contact_jsonb	CREATE OR REPLACE FUNCTION public.validate_contact_jsonb(contact_data jsonb) RETURNS boolean LANGUAGE plpgsql AS $function$ BEGIN RETURN contact_data ? 'personId' AND contact_data ? 'name' AND contact_data ? 'mineGroup' AND contact_data ? 'mineName'; END; $function$

```

---

## Query 11: Get Sequences

```sql
-- Get all sequences (for auto-incrementing IDs)
SELECT 
  schemaname,
  sequencename,
  last_value,
  increment_by
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename;
```

**RESULTS:**
```
No sequences found (empty result set)
```

---

## Summary

Once all queries are complete, I'll analyze:
- ✅ What migration tracking exists
- ✅ What tables/columns are actually in production
- ✅ What constraints and indexes exist
- ✅ Any drift from current `lib/database/schema.ts`
- ✅ Whether reconciliation migration is needed

---

## Next Steps After Audit

Based on results, we'll determine:
1. **If drift exists**: Create Phase 2 reconciliation migration
2. **If aligned**: Skip to Phase 3 (Initialize Drizzle tracking)
3. **Unknown tables/constraints**: Document and decide whether to keep or drop

