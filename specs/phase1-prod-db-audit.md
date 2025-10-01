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
[Paste results here]
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
[Paste results here]
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
[Paste results here]
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
[Paste results here]
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
[Paste results here]
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
[Paste results here - this will be a long list]
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
[Paste results here]
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
[Paste results here]
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
[Paste results here]
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
[Paste results here]
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
[Paste results here - this will be a long list]
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
[Paste results here]
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
[Paste results here - function definitions will be verbose]
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
[Paste results here]
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

