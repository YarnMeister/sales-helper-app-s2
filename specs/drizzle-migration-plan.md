# Drizzle Migration System - Implementation Plan

**Date:** October 2, 2025
**Status:** Implementation Ready
**Branch:** main

---

## Executive Summary

This document outlines the complete implementation plan for establishing a robust, two-mode migration system that:
1. Fixes current broken state (migrations 022-026 not running)
2. Establishes true baseline in production
3. Provides clear guidance for future development
4. Permanently retires the legacy migration system

---

## Current State Analysis

### Problems Identified

**Gap 1: Two Migration Systems Running in Parallel**
- Drizzle's official system: `lib/database/migrations/` with journal (legacy 0000-0002)
- Custom manual system: `migrations/` (root) with NO journal (022-026)
- Migrations 022-026 are orphaned - Drizzle doesn't know about them
- Production deployment shows: "No migrations journal found" → marks all as applied without running

**Gap 2: Neon HTTP Driver Limitation**
- Neon HTTP driver does NOT support multi-statement SQL
- Migrations 022-026 contain multiple statements (DROP, CREATE, INDEX, COMMENT)
- Error: `cannot insert multiple commands into a prepared statement`
- Drizzle's `migrate()` function fails with current driver

**Gap 3: Aggressive Sync Logic**
- `unified-migrate.js` auto-marks migrations as applied when it detects existing tables
- Prevents legitimate migrations from running in production

**Gap 4: Production Impact**
- `flow_metrics_config` table lacks JSONB structure
- Cannot save metrics in production
- Migrations 022-026 never executed

---

## Solution: Pragmatic Two-Mode Migration System

### Core Principle
**Default to Drizzle Kit (HTTP), escalate to WebSocket consolidation when complexity warrants it.**

### Two Migration Modes

**Mode 1: Standard Drizzle Kit (Default)**
- Use for: Normal development, incremental changes, feature branches with ≤20 migrations
- Driver: HTTP (`@neondatabase/serverless` with `neon()`)
- Limitation: Each migration must be a single SQL statement
- Workflow: Edit schema → `npm run db:generate` → `npm run db:migrate`

**Mode 2: Consolidated WebSocket Migrations (Complex Changes)**
- Use for: Feature branches with >20 migrations, complex schema refactors
- Driver: WebSocket (`@neondatabase/serverless` with `Pool`)
- Benefit: Full PostgreSQL transaction support, multi-statement SQL
- Workflow: Develop with Drizzle Kit → Consolidate before merge → Test → Deploy

---

## Implementation Phases

### Phase 0: Bootstrap Current Migrations (IMMEDIATE - BLOCKING)

**Goal:** Get migrations 022-026 running in production using WebSocket

**Tasks:**
1. Create `scripts/run-websocket-migrations.ts` - one-time bootstrap script
2. Uses WebSocket driver to execute multi-statement migrations
3. Reads migrations 022-026 from `migrations/` folder
4. Tracks in `__drizzle_migrations` table
5. Test in dev, then deploy to production

**Success Criteria:**
- ✅ Production has JSONB `flow_metrics_config` structure
- ✅ Can create/save metrics
- ✅ All 5 migrations tracked in `__drizzle_migrations`

**Time Estimate:** 1 hour

---

### Phase 1: Implement Two-Mode Infrastructure (FOUNDATION)

**Goal:** Set up infrastructure for Mode 1 (Drizzle Kit) and Mode 2 (Consolidated)

**Tasks:**

**1.1 Update Directory Structure**
```
lib/database/
├── schema.ts                          # Source of truth
├── migrations/                        # Mode 1: Drizzle Kit (HTTP)
│   ├── meta/
│   │   ├── _journal.json
│   │   └── 0000_snapshot.json
│   └── 0000_baseline.sql             # First Drizzle-generated migration
└── migrations-consolidated/           # Mode 2: WebSocket complex migrations
    └── (empty for now)
```

**1.2 Create Baseline Migration**
- Ensure `schema.ts` matches production exactly
- Run `npm run db:generate` to create migration 0000
- Mark baseline as already applied in production

**1.3 Install Dependencies**
```bash
npm install ws
npm install -D @types/ws tsx
```

**1.4 Create Helper Scripts**
- `scripts/count-branch-migrations.ts` - Check if consolidation needed
- `scripts/consolidate-migrations.ts` - Create consolidated migration
- `scripts/migrate-consolidated.ts` - Apply consolidated migrations

**1.5 Update package.json**
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:consolidate-branch": "tsx scripts/consolidate-migrations.ts",
    "db:migrate-consolidated": "tsx scripts/migrate-consolidated.ts",
    "db:count-branch-migrations": "tsx scripts/count-branch-migrations.ts",
    "db:bootstrap-websocket": "tsx scripts/run-websocket-migrations.ts"
  }
}
```

**Success Criteria:**
- ✅ Directory structure matches spec
- ✅ Baseline migration exists and is tracked
- ✅ All helper scripts created and tested
- ✅ Dependencies installed

**Time Estimate:** 1.5 hours

---

### Phase 2: Establish True Baseline (PRODUCTION READY)

**Goal:** Production has clean baseline, ready for future migrations

**Tasks:**

**2.1 Update drizzle.config.ts**
```typescript
export default defineConfig({
  schema: './lib/database/schema.ts',
  out: './lib/database/migrations',  // Mode 1 location
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

**2.2 Verify Baseline in Production**
```sql
SELECT * FROM __drizzle_migrations ORDER BY created_at;
-- Should show: 022-026 + 0000_baseline
```

**2.3 Test Future Migration Workflow**
- Make test schema change
- Generate migration with `npm run db:generate`
- Apply with `npm run db:migrate`
- Verify in Drizzle Studio

**Success Criteria:**
- ✅ Baseline tracked correctly in production
- ✅ Test migration works end-to-end
- ✅ No errors in CI/CD pipeline

**Time Estimate:** 45 minutes


---

### Phase 3: Clear Guidance for Future Development (DOCUMENTATION)

**Goal:** Developers know which mode to use and when

**Tasks:**

**3.1 Create MIGRATION_GUIDE.md**
- Document two-mode system
- Provide decision tree
- Include examples for both modes
- Add troubleshooting section

**3.2 Update Existing Docs**
- `docs/migration-policy.md` - Add two-mode section
- `.augment/rules/CLAUDE.md` - Add migration context
- `README.md` - Link to MIGRATION_GUIDE.md

**3.3 Add Pre-Merge Check**
- Create `.github/workflows/check-migrations.yml`
- Runs `npm run db:count-branch-migrations`
- Warns if >20 migrations on branch

**Success Criteria:**
- ✅ MIGRATION_GUIDE.md complete and clear
- ✅ All docs updated
- ✅ CI check working

**Time Estimate:** 1 hour

---

### Phase 4: Retire Legacy System (CLEANUP)

**Goal:** Permanently disable old migration system

**Tasks:**

**4.1 Delete Legacy Files**
```bash
rm -rf migrations/022_*.sql
rm -rf migrations/023_*.sql
rm -rf migrations/024_*.sql
rm -rf migrations/025_*.sql
rm -rf migrations/026_*.sql
rm -rf migrations/  # Entire root migrations folder
```

**4.2 Remove Legacy Scripts**
- Delete `scripts/unified-migrate.js`
- Remove custom migration tracking code
- Clean up any legacy migration utilities

**4.3 Update Build Command**
```json
{
  "scripts": {
    "dev": "npm run env:check && npm run db:migrate && next dev",
    "build": "npm run env:check && npm run db:migrate && next build"
  }
}
```

**4.4 Remove Legacy Tables (Optional)**
```sql
DROP TABLE IF EXISTS schema_migrations;
```

**4.5 Document Retirement**
- Create `docs/legacy-migration-retirement.md`
- Document what was retired and why
- Provide historical reference

**Success Criteria:**
- ✅ All legacy files deleted
- ✅ Build uses Drizzle Kit only
- ✅ Legacy system documented as retired

**Time Estimate:** 30 minutes

---

## Timeline & Dependencies

```
Phase 0: Bootstrap (BLOCKING - Do First)          [1 hour]
    ↓
Phase 1: Two-Mode Infrastructure (FOUNDATION)     [1.5 hours]
    ↓
Phase 2: Establish Baseline (PRODUCTION READY)    [45 minutes]
    ↓
Phase 3: Documentation (GUIDANCE)                 [1 hour]
    ↓
Phase 4: Retire Legacy (CLEANUP)                  [30 minutes]

TOTAL: ~4.75 hours
```

---

## Success Criteria Validation

### 1. Implement WebSocket for Migrations 022-026
✅ Phase 0 creates WebSocket runner
✅ Runs migrations 022-026 in production
✅ Tracks in `__drizzle_migrations`
✅ Production gets JSONB structure

### 2. True Baseline in Production
✅ Phase 1.2 creates Drizzle baseline migration
✅ Phase 2.2 verifies baseline tracked correctly
✅ Future migrations work automatically
✅ No more "orphaned" migrations

### 3. Clear Guidance for Future Development
✅ Phase 3.1 creates MIGRATION_GUIDE.md
✅ Phase 3.2 updates all docs
✅ Phase 3.3 adds automated checks
✅ Decision tree: ≤20 migrations = Mode 1, >20 = Mode 2

### 4. Retire Legacy System
✅ Phase 4.1 deletes all legacy migration files
✅ Phase 4.2 removes legacy scripts
✅ Phase 4.3 updates build to use Drizzle Kit only
✅ Phase 4.4 removes `schema_migrations` table
✅ Phase 4.5 documents what was retired and why

---

## Next Steps

1. Review this plan
2. Confirm approach aligns with requirements
3. Begin Phase 0 implementation
4. Test in dev before production deployment
