# Phase 4: Legacy Migration System Deletion Plan

**Date**: October 1, 2025  
**Status**: Ready to Execute  
**Branch**: `feature/migration-consolidation`

---

## Files to DELETE

### 1. Legacy Migration SQL Files
**Path**: `/migrations/`

All 15 SQL files in this folder represent the old migration system:
- 001_initial_schema.sql
- 002_support_tables.sql
- 003_database_functions.sql
- 004_site_visits_table.sql
- 007_create_mock_tables.sql
- 009_separate_sequences_for_prod_and_mock.sql
- 012_pipedrive_flow_data.sql
- 013_add_pipedrive_event_id.sql
- 014_fix_pipedrive_event_id.sql
- 015_canonical_stage_mappings.sql
- 016_enhanced_canonical_stages_data_modeling.sql
- 017_stage_id_mappings.sql
- 018_flow_metrics_thresholds_and_comments.sql
- 019_ensure_pipedrive_submissions_schema.sql
- 021_master_cleanup_and_schema_rebuild.sql

**Reason**: These were applied via the old `scripts/migrate.js` system. Production already has these applied. Drizzle doesn't use this folder.

### 2. Legacy Migration Scripts
**Path**: `/scripts/`

- **migrate.js** - Old Node.js migration runner (replaced by run-migrations.js)
- **migrate-drizzle-schema.js** - Old Drizzle helper (no longer needed)
- **migrate-drizzle-data.js** - Old Drizzle helper (no longer needed)
- **migrate-test-db.js** - Test helper for old system (no longer needed)

**Reason**: These scripts ran the old `/migrations/` SQL files. Now replaced by Drizzle Kit + run-migrations.js.

### 3. Old Migration Helper Scripts (from troubleshooting)

- **scripts/force-apply-migration-17.js** - One-off fix script
- **scripts/fix-migration-17.js** - One-off fix script

**Reason**: These were temporary fixes for migration 017. No longer needed.

---

## Files to KEEP

### 1. Environment-Specific Migration Wrappers
**Keep**: `scripts/migrate-env.sh`, `scripts/neon-utils.sh`

**Reason**: These are still useful! They just set environment variables and call `npm run db:migrate` (which now uses Drizzle). They're environment helpers, not part of the legacy system.

### 2. New Drizzle System
**Keep**: Everything in `/lib/database/migrations/`

- 0000_mighty_reaper.sql (baseline)
- meta/_journal.json
- meta/*.json snapshots

**Reason**: This is the NEW Drizzle migration system.

### 3. New Drizzle Scripts
**Keep**:
- `scripts/run-migrations.js` (new Drizzle runner)
- `scripts/init-drizzle-tracking.js` (initialization helper)
- `scripts/recreate-dev-db.js` (dev reset utility)
- `scripts/check-db-tables.js` (debugging helper)
- `scripts/check-drizzle-migrations.js` (debugging helper)

**Reason**: These are part of the NEW system.

### 4. Package.json Scripts
**Keep**:
- `db:migrate` → now calls run-migrations.js
- `db:migrate-dev`, `db:migrate-preview`, `db:migrate-prod` → call migrate-env.sh which uses new system
- `neon:migrate` → calls neon-utils.sh which uses new system

**Reason**: These commands now use the Drizzle system internally.

---

## Package.json Cleanup

**Current state**:
```json
{
  "scripts": {
    "db:migrate": "node scripts/run-migrations.js",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push --force",
    "db:studio": "drizzle-kit studio",
    "db:reset-dev": "node scripts/recreate-dev-db.js && npm run db:push",
    "db:migrate-dev": "./scripts/migrate-env.sh dev",
    "db:migrate-preview": "./scripts/migrate-env.sh preview/pr-123",
    "db:migrate-prod": "./scripts/migrate-env.sh main",
    "neon:migrate": "./scripts/neon-utils.sh migrate"
  }
}
```

**No changes needed** - all scripts now point to the new Drizzle system!

---

## Execution Plan

### Step 1: Delete legacy migration folder
```bash
rm -rf /migrations/
```

### Step 2: Delete legacy migration scripts
```bash
rm scripts/migrate.js
rm scripts/migrate-drizzle-schema.js
rm scripts/migrate-drizzle-data.js
rm scripts/migrate-test-db.js
```

### Step 3: Delete old one-off fix scripts
```bash
rm scripts/force-apply-migration-17.js
rm scripts/fix-migration-17.js
```

### Step 4: Verify build still works
```bash
npm run build
```

### Step 5: Verify dev still works
```bash
npm run dev
```

### Step 6: Commit changes
```bash
git add -A
git commit -m "feat: Remove legacy migration system (Phase 4)"
```

---

## Safety Checks

Before deletion:
- [ ] Production backup exists (confirmed earlier)
- [ ] Dev database working with new system ✓
- [ ] `npm run db:migrate` works ✓
- [ ] `npm run dev` works ✓
- [ ] All changes committed to git ✓

After deletion:
- [ ] No broken imports/references
- [ ] Build succeeds
- [ ] Dev server starts
- [ ] Tests pass

---

## Rollback Plan

If something breaks:
```bash
git revert HEAD
npm install
npm run db:reset-dev
```

---

## Impact Analysis

**Low Risk**:
- Legacy SQL files never referenced in code
- Legacy scripts only called via npm scripts (which we've replaced)
- Git history preserves all deleted files
- Easy rollback via git revert

**Zero Data Loss**:
- Production database unaffected
- Dev database already using new system
- No DDL changes, only file deletions

---

## Next Phase

After Phase 4 complete → **Phase 5**: Consolidate Drizzle folders
- Delete old `/drizzle/` folder
- Keep only `/lib/database/migrations/`

