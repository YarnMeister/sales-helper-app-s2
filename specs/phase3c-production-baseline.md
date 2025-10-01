# Phase 3C: Initialize Drizzle in Production (Zero Data Loss)

**Date**: October 1, 2025  
**Status**: Ready to Execute  
**Branch**: `feature/migration-consolidation`

---

## Goal

Initialize Drizzle's tracking system in production WITHOUT:
- ❌ Dropping any tables
- ❌ Losing any data
- ❌ Running any DDL that modifies existing structure

**Result**: Drizzle will know production's current state and only apply FUTURE migrations.

---

## How It Works

### Drizzle's Migration Tracking

Drizzle uses a table called `__drizzle_migrations` to track which migrations have run:

```sql
CREATE TABLE __drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash TEXT NOT NULL,
  created_at BIGINT
);
```

Each row represents a migration file that was executed.

### The Baseline Concept

A **baseline migration** is a SQL file that says "IF NOT EXISTS, create these tables." When we mark it as "already applied," Drizzle:
1. Sees the migration file exists
2. Sees it's marked as applied in `__drizzle_migrations`
3. Skips running it
4. Only runs NEWER migrations

**Result**: No DDL runs against production, data is safe ✅

---

## Step-by-Step Process

### Step 1: Generate Baseline Migration

We need to create a migration file that represents production's current state.

**Option A: Use Production Audit Results** (Recommended)

Based on our Phase 1 audit, we know exactly what's in production. We'll create a migration manually:

```bash
# Create baseline migration file
touch lib/database/migrations/0000_baseline_production.sql
```

Content:
```sql
-- Baseline migration: Represents production state as of Oct 1, 2025
-- This migration will be marked as "already applied" and never run
-- All tables, indexes, and constraints already exist in production

-- Type
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM('draft', 'submitted', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tables (using IF NOT EXISTS for safety)
CREATE TABLE IF NOT EXISTS canonical_stage_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_config_id uuid,
  canonical_stage text NOT NULL,
  start_stage text,
  end_stage text,
  start_stage_id integer,
  end_stage_id integer,
  avg_min_days integer,
  avg_max_days integer,
  metric_comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flow_metrics_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key text NOT NULL UNIQUE,
  display_title text NOT NULL,
  canonical_stage text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pipedrive_deal_flow_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id integer NOT NULL,
  pipeline_id bigint NOT NULL,
  stage_id integer NOT NULL,
  stage_name text NOT NULL,
  entered_at timestamptz NOT NULL,
  left_at timestamptz,
  duration_seconds bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  pipedrive_event_id bigint NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS pipedrive_metric_data (
  id bigint PRIMARY KEY,
  title text NOT NULL,
  pipeline_id bigint NOT NULL,
  stage_id bigint NOT NULL,
  status text NOT NULL,
  first_fetched_at timestamptz DEFAULT now(),
  last_fetched_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pipedrive_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL,
  payload jsonb NOT NULL,
  simulated_deal_id integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text UNIQUE,
  status request_status NOT NULL DEFAULT 'draft',
  salesperson_first_name text,
  salesperson_selection text,
  mine_group text,
  mine_name text,
  contact jsonb,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  comment text,
  pipedrive_deal_id integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version integer PRIMARY KEY,
  name text NOT NULL,
  executed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT now(),
  salesperson text NOT NULL,
  planned_mines text[] NOT NULL,
  main_purpose text NOT NULL,
  availability text NOT NULL,
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- Foreign Keys (IF NOT EXISTS not needed, will error if exists)
DO $$ BEGIN
  ALTER TABLE canonical_stage_mappings 
    ADD CONSTRAINT canonical_stage_mappings_metric_config_id_fk 
    FOREIGN KEY (metric_config_id) 
    REFERENCES flow_metrics_config(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Note: Indexes omitted for brevity
-- Production has minimal indexes, we can add performance indexes later
```

**Option B: Use Drizzle Introspect** (Alternative)

```bash
# Generate schema from production
npx drizzle-kit introspect --config=drizzle.config.prod.ts

# This creates a snapshot of production
# Move it to lib/database/migrations/0000_baseline.sql
```

### Step 2: Update Drizzle Journal

Edit `lib/database/migrations/meta/_journal.json`:

```json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1727740800000,
      "tag": "0000_baseline_production",
      "breakpoints": true
    }
  ]
}
```

Also create `lib/database/migrations/meta/0000_snapshot.json` (Drizzle generates this automatically when you run `drizzle-kit generate`).

### Step 3: Mark Baseline as Applied in Production

Run this SQL **directly in production** (using your SQL client, not the app):

```sql
-- Step 1: Create Drizzle's tracking table
CREATE TABLE IF NOT EXISTS __drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash TEXT NOT NULL,
  created_at BIGINT
);

-- Step 2: Calculate hash for baseline migration
-- (In practice, you'd get this from the actual migration file)
-- For now, use a placeholder
INSERT INTO __drizzle_migrations (hash, created_at)
VALUES ('baseline-production-oct-2025', EXTRACT(EPOCH FROM NOW()) * 1000);
```

**Important**: The `hash` value must match what Drizzle expects. You can get the correct hash by:
1. Running the migration locally first
2. Checking what hash Drizzle generated
3. Using that exact hash in production

Or use this helper script:

```javascript
// scripts/initialize-drizzle-prod.js
import { sql } from '@vercel/postgres';

async function initializeDrizzle() {
  // Create tracking table
  await sql`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT
    )
  `;
  
  // Mark baseline as applied
  await sql`
    INSERT INTO __drizzle_migrations (hash, created_at)
    VALUES ('0000_baseline_production', ${Date.now()})
    ON CONFLICT DO NOTHING
  `;
  
  console.log('✅ Drizzle initialized in production');
}

initializeDrizzle();
```

### Step 4: Verify (DO NOT RUN MIGRATIONS YET!)

Check production:

```sql
-- Should return 1 row (baseline)
SELECT * FROM __drizzle_migrations;

-- Should still have all your data
SELECT COUNT(*) FROM requests;
SELECT COUNT(*) FROM site_visits;
-- etc.
```

✅ **At this point, Drizzle knows about production but hasn't changed anything!**

---

## Future Workflow

### Making Schema Changes

```bash
# 1. Edit schema.ts
# 2. Generate migration
npm run db:generate

# This creates: lib/database/migrations/0001_your_change.sql

# 3. Test locally
npm run db:push  # or apply migration to local db

# 4. Commit migration file
git add lib/database/migrations/0001_your_change.sql
git commit -m "feat: add users table"

# 5. Deploy to production
# In CI/CD, run: npm run db:migrate
# This applies ONLY migrations not in __drizzle_migrations
```

---

## Safety Checks

### Before Production Initialization

- [ ] Full database backup taken
- [ ] Phase 1 audit results reviewed
- [ ] Baseline migration tested locally
- [ ] `__drizzle_migrations` table doesn't exist yet
- [ ] All stakeholders notified

### After Production Initialization

- [ ] `__drizzle_migrations` table exists
- [ ] Has exactly 1 row (baseline)
- [ ] All tables still exist
- [ ] All data intact (spot check counts)
- [ ] App still works (smoke test)

---

## Rollback Plan

If something goes wrong:

```sql
-- Remove Drizzle tracking (no data loss)
DROP TABLE IF EXISTS __drizzle_migrations;

-- That's it! Your data is safe, Drizzle just won't track anymore
-- You can re-initialize later
```

---

## Alternative: Simpler Approach

If the baseline migration feels too complex, you can:

1. **Skip the baseline migration file entirely**
2. **Just create the tracking table with no entries**
3. **Future migrations will ADD to existing schema**

```sql
-- In production:
CREATE TABLE __drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash TEXT NOT NULL,
  created_at BIGINT
);

-- Leave it empty!
-- Future migrations will just ADD new tables/columns
-- Existing tables are unaffected
```

This works if:
- You're only ADDING features going forward
- You won't MODIFY existing tables
- You're okay with schema.ts not perfectly matching prod initially

---

## Recommendation

**Use the Simpler Approach** (empty `__drizzle_migrations`):

**Pros**:
- Zero risk to production
- No baseline migration complexity
- Future migrations just add incrementally

**Cons**:
- schema.ts and prod may drift slightly
- Can't use Drizzle to manage existing tables

**For your use case**: This is perfect since you're primarily adding new features (flow-metrics module), not modifying legacy tables.

---

## Next Step

Which approach do you prefer?

**A)** Create baseline migration (full Drizzle management)
**B)** Simple empty tracking table (future-only management)
**C)** Wait and decide later

I recommend **B** for safety and simplicity.

