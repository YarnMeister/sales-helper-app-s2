# Database Migration System Decommissioning Plan

**Date**: October 1, 2025  
**Status**: Proposal - Pending Approval  
**Goal**: Decommission legacy migration system, consolidate on Drizzle Kit only

---

## Current State Assessment

### Legacy System (`/migrations/` folder)
- **Location**: `/migrations/` with 20 SQL files (001-026)
- **Tracking**: `schema_migrations` table (version, name, executed_at)
- **Execution**: `scripts/migrate.js`
- **Command**: `npm run db:migrate`
- **Status**: ❌ **Problematic** - Recent migrations (022-026) failed silently due to `sql.unsafe()` bug

### Drizzle System (Two locations!)
1. **`/drizzle/`** - 2 migrations (0000, 0001) - OLD LOCATION
2. **`/lib/database/migrations/`** - 5 migrations (0000-0003, 0002_flow_metrics_jsonb) - ACTIVE LOCATION
- **Tracking**: `__drizzle_migrations` table (Drizzle's internal)
- **Execution**: Drizzle Kit CLI + `migrate()` function
- **Commands**: `db:push`, `db:generate`, `db:migrate-drizzle`
- **Config**: `drizzle.config.ts` points to `./lib/database/migrations`

### Hybrid Scripts (Confusion Layer)
- `hybrid-migrate.js` - Tries to run both systems
- `safe-migrate.js`, `prod-migrate.js`, `post-deploy-migrate.js` - Various wrappers
- `drizzle-migrate.js`, `drizzle-complete-migrate.js` - Drizzle-specific
- `migrate-env.sh` - Shell wrapper

---

## Why This Is a Problem

1. **Two sources of truth**: `schema_migrations` vs `__drizzle_migrations`
2. **Duplication**: Multiple migration folders with overlapping purposes
3. **Silent failures**: Legacy system failed without detection for migrations 022-026
4. **Developer confusion**: Which system to use? Which folder to put migrations in?
5. **Risk**: Future developers may add to wrong folder
6. **Technical debt**: 10+ migration scripts doing similar things

---

## Decommissioning Proposal

### Phase 1: Audit & Baseline
**Goal**: Understand exactly what's in production vs what Drizzle thinks should be there

**Steps**:
1. **Production Database Audit**
   - Query production: Check both `schema_migrations` AND `__drizzle_migrations`
   - List all actual tables/columns/constraints in production
   - Save this as "production baseline"

2. **Drizzle Schema Comparison**
   - Run `drizzle-kit generate` on current `schema.ts`
   - Compare generated SQL with production baseline
   - Document any drift (we know flow_metrics is already reconciled)

3. **Decision Point**: 
   - If drift exists: Create one final reconciliation migration
   - If aligned: Proceed to Phase 2

**Testing**: 
- Create a local test database, apply all legacy migrations, verify state matches production
- Run Drizzle's `db:push` on a separate test database, verify it matches

---

### Phase 2: Create Final Legacy Reconciliation (if needed)
**Goal**: Ensure production DB matches Drizzle's expectations

**Steps**:
1. Create `migrations/027_final_reconciliation.sql`:
   ```sql
   -- Document exact state of production
   -- Add any missing indexes/constraints Drizzle expects
   -- Remove any orphaned objects
   ```

2. Apply this to production via the legacy system one last time
3. Verify production now matches `drizzle-kit generate` output exactly

**Testing**:
- Apply to staging/preview environment first (if available)
- Run comprehensive integration tests
- Verify all existing queries still work

---

### Phase 3: Initialize Drizzle Tracking
**Goal**: Tell Drizzle that production DB is at "baseline" state

**Option B - Preserve History** (RECOMMENDED):
- Keep `__drizzle_migrations` table as-is
- Manually insert records for any migrations that should be "applied"
- Going forward, only use `drizzle-kit generate` for new changes
- **Result**: Drizzle continues from current state

**Testing**:
- Verify `__drizzle_migrations` table has correct entries
- Run `drizzle-kit generate` - should show "No schema changes detected"
- Make a trivial schema change, generate migration, verify it works

---

### Phase 4: Delete Legacy System
**Goal**: Remove all legacy migration code and documentation

**Files to DELETE**:
```
/migrations/                              (entire folder - 20 files)
/scripts/migrate.js                       (main legacy runner)
/scripts/hybrid-migrate.js
/scripts/safe-migrate.js
/scripts/prod-migrate.js
/scripts/post-deploy-migrate.js
/scripts/migrate-test-db.js
/scripts/migrate-drizzle-data.js
/scripts/migrate-drizzle-schema.js
/scripts/verify-migrations.js
/scripts/check-migrations.js
/scripts/check-migration-status.js
/scripts/reset-migrations.js
/scripts/migrate-env.sh
/scripts/reset-flow-metrics-table.js      (temp script from recent fixes)
/scripts/create-flow-metrics-table.js     (temp script from recent fixes)
```

**Schema Changes**:
- Remove `schemaMigrations` table from `lib/database/schema.ts` (lines 156-160)
- Drop `schema_migrations` table from production database

**package.json Changes**:
```diff
- "db:migrate": "node scripts/migrate.js",
- "db:migrate-drizzle": "node scripts/migrate-drizzle-data.js",
- "db:verify": "node -e \"import('./lib/database/migrations.js').then(m => m.verifyMigration())\"",
- "db:check-schema": "node scripts/migrate-drizzle-schema.js",
+ "db:migrate": "drizzle-kit migrate",
```

**Update `dev` script**:
```diff
- "dev": "npm run env:check && npm run db:migrate && next dev",
+ "dev": "npm run env:check && next dev",
```
(Drizzle migrations should be run manually when needed, not on every dev startup)

---

### Phase 5: Consolidate Drizzle Folders
**Goal**: Single source of truth for Drizzle migrations

**Current State**:
- `/drizzle/` - Has 2 old migrations
- `/lib/database/migrations/` - Has 5 migrations, is the configured target

**Decision**: Keep `/lib/database/migrations/`, delete `/drizzle/`

**Steps**:
1. Verify `/drizzle/` migrations are already applied in production
2. Delete `/drizzle/` folder entirely
3. All future migrations live in `/lib/database/migrations/`

---

### Phase 6: Update Documentation & Workflows
**Goal**: Developer clarity on new process

**Update `project_config.md`**:
Add new section:
```markdown
## Database Migrations (Drizzle Only)

**Making Schema Changes**:
1. Edit `lib/database/schema.ts`
2. Run `npm run db:generate` - creates migration in `/lib/database/migrations/`
3. Review generated SQL file
4. Run `npm run db:migrate` to apply to local database
5. Test locally thoroughly
6. Commit migration files with your feature branch
7. On production deployment, migrations run automatically via Vercel build

**Important**:
- NEVER manually create SQL files in `/lib/database/migrations/`
- NEVER edit generated migration files (edit schema.ts instead)
- ALWAYS commit generated migration files
- For complex migrations, use Drizzle's custom migration capabilities

**Checking Migration Status**:
- `npm run db:studio` - Open Drizzle Studio to view database
- Query `__drizzle_migrations` table to see applied migrations
```

---

### Phase 7: Production Deployment Test
**Goal**: Verify new system works in production

**Steps**:
1. Make a trivial schema change (e.g., add a comment to a table)
2. Run `npm run db:generate`
3. Review generated migration
4. Test locally
5. Commit to feature branch
6. Deploy to production
7. Verify migration ran automatically
8. Verify application still works

**Rollback Plan**:
- If deployment fails, revert merge to main
- Debug issue on feature branch
- Document what went wrong

---

## Testing Strategy

### 1. Unit Tests (Existing)
- Verify no imports of deleted migration scripts
- Update any tests that reference `schema_migrations` table

### 2. Integration Tests
Create new test: `tests/integration/drizzle-migrations.test.ts`
```typescript
describe('Drizzle Migrations', () => {
  it('should generate migration for schema changes', async () => {
    // Test that drizzle-kit generate works
  });
  
  it('should apply migrations to test database', async () => {
    // Test that migrations run successfully
  });
  
  it('should be idempotent (safe to run multiple times)', async () => {
    // Test running same migration twice doesn't error
  });
});
```

### 3. Local Testing Checklist
- [ ] Delete `/migrations/` folder
- [ ] Delete legacy migration scripts
- [ ] Run `npm install` to ensure no script dependencies break
- [ ] Run `npm run lint` - should pass
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run build` - clean build
- [ ] Start dev server - no migration errors
- [ ] Make test schema change, generate migration, apply it
- [ ] Verify application works with new schema

### 4. Production Smoke Tests (Post-deploy)
- [ ] Check Vercel logs for migration execution
- [ ] Query `__drizzle_migrations` table - verify new migration listed
- [ ] Test critical user flows (login, data entry, reports)
- [ ] Monitor error logs for 24 hours
- [ ] Verify database backup exists before migration

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Production data loss | **CRITICAL** | Full database backup before Phase 2, test on staging first |
| Migration fails mid-deployment | **HIGH** | Drizzle uses transactions, should auto-rollback. Have manual rollback SQL ready |
| Drift between prod and Drizzle | **HIGH** | Phase 1 audit catches this. Create reconciliation migration if needed |
| Team confusion during transition | **MEDIUM** | Clear docs, Slack announcement, pair programming for first new migration |
| Accidental use of legacy system | **LOW** | Delete scripts immediately, update package.json |
| Vercel build failures | **MEDIUM** | Test `npm run build` locally, have rollback plan for main branch |

---

## Timeline Estimate

- **Phase 1** (Audit): 2-3 hours
- **Phase 2** (Reconciliation): 1-2 hours (if needed)
- **Phase 3** (Initialize Drizzle): 1 hour
- **Phase 4** (Delete Legacy): 30 minutes
- **Phase 5** (Consolidate): 15 minutes
- **Phase 6** (Documentation): 1 hour
- **Phase 7** (Production Test): 1 hour + monitoring

**Total**: ~7-9 hours of work + 24h monitoring

---

## Recommendation

**Proceed with decommissioning**: The legacy system has already proven unreliable (migrations 022-026 failed silently). Drizzle is the industry-standard approach and will prevent future issues.

**Suggested Approach**: 
- Do **Option B** (Preserve History) in Phase 3
- This keeps your migration history for audit purposes
- Minimizes risk of "unknown state" scenarios

**Before Starting**:
1. Take a full production database backup
2. Review Phase 1 audit results
3. Block out dedicated time (no interruptions during prod deployment)

---

## Related Work

**Parked Feature Branch**: `feature/flow-metrics-module`
- Phase 2 implementation was in progress
- Flow metrics UI now saves successfully but not fetching from DB yet
- Need to fix GET endpoints once migration consolidation is complete
- Resume work after migration system is stable
