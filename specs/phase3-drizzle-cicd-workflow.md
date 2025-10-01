# Phase 3: Drizzle CI/CD Workflow

**Date**: October 1, 2025  
**Status**: ✅ Complete  
**Branch**: `feature/migration-consolidation`

---

## What We Accomplished

✅ **Dev database now matches production schema**
- Dropped all tables in dev
- Used `drizzle-kit push --force` to recreate from `schema.ts`
- 8 tables created successfully
- App builds and runs ✓

---

## Key Learnings: Drizzle Interactive Prompts

### The Problem
`drizzle-kit push --force` and `drizzle-kit generate` both have **interactive prompts** that cannot be disabled, even with `--force`:

1. **Rename vs Create**: "Is this column created or renamed?"
2. **Truncate vs Error**: "Table has data, truncate or error?"
3. **Migration conflicts**: Various ambiguity scenarios

**These prompts make them unsuitable for CI/CD!**

### The Solution
The interactive prompts only appear when there's **ambiguity**:
- ✅ **Empty database** → No prompts (nothing to rename, no data to truncate)
- ❌ **Existing schema drift** → Prompts appear

**For dev**: Drop all tables first, then push → No prompts!

---

## Proper CI/CD Workflow

### Development Workflow

**Option A: Clean Slate (Recommended for initial setup)**
```bash
# 1. Reset dev database to match schema.ts
npm run db:reset-dev

# This runs:
# - node scripts/recreate-dev-db.js (drops all tables)
# - npm run db:push (creates tables from schema.ts)
```

**Option B: Incremental Changes (Day-to-day work)**
```bash
# 1. Edit lib/database/schema.ts
# 2. Push changes to dev database
npm run db:push

# If you get interactive prompts:
#   - Answer them manually (dev only)
#   - OR use db:reset-dev for clean slate
```

###

 Production/CI-CD Workflow

**DO NOT use `drizzle-kit push` in production!**

Instead, use the **generate → migrate** pattern:

```bash
# Step 1: Generate migration file (in development)
npm run db:generate

# This creates a SQL file in lib/database/migrations/
# Example: lib/database/migrations/0005_add_user_table.sql

# Step 2: Review the generated SQL
# - Check that it does what you expect
# - Manually edit if needed
# - Commit the migration file to git

# Step 3: In CI/CD pipeline (Vercel build, etc.)
# Run migrations programmatically (no prompts)
# See "Migration Runner" section below
```

---

## Migration Runner for CI/CD

Create `scripts/run-migrations.js`:

```javascript
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';

async function runMigrations() {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './lib/database/migrations' });
  console.log('Migrations complete!');
}

runMigrations();
```

Add to `package.json`:
```json
{
  "scripts": {
    "db:migrate": "node scripts/run-migrations.js"
  }
}
```

Update `vercel.json` (or your build config):
```json
{
  "build": {
    "env": {
      "DATABASE_URL": "@database_url"
    }
  },
  "buildCommand": "npm run db:migrate && npm run build"
}
```

---

## Current State

### Dev Database
- ✅ 8 tables matching production
- ✅ All indexes created
- ✅ Foreign keys in place
- ✅ Enums configured correctly

### schema.ts
- ✅ Matches production structure
- ✅ `request_status` enum: draft, submitted, approved, rejected
- ✅ `pipedrive_deal_flow_data` has pipeline_id, pipedrive_event_id
- ✅ `pipedrive_metric_data` matches production structure
- ✅ No mock_requests, flow_metrics, kv_cache tables

### Scripts Created
- ✅ `scripts/recreate-dev-db.js` - Drops all tables
- ✅ `scripts/check-db-tables.js` - Lists current tables
- ✅ `npm run db:reset-dev` - Complete dev reset

---

## Next Steps

### Remaining from Original Plan

**Phase 3C**: Initialize Drizzle tracking in production
- Decide: Use Drizzle for production or keep legacy system?
- If Drizzle: Need to tell it production is at "baseline" state

**Phase 4**: Delete legacy migration system
- Remove `/migrations/` folder
- Remove legacy scripts
- Clean up package.json

**Phase 5**: Consolidate Drizzle folders
- Delete `/drizzle/` (old location)
- Keep `/lib/database/migrations/` only

**Phase 6**: Update documentation
- project_config.md
- README.md

**Phase 7**: Production deployment test

---

## Recommendations

### For Production

**Option 1: Drizzle-Only (Recommended)**
1. Document current production state as "baseline"
2. Delete legacy `/migrations/` folder
3. Use `drizzle-kit generate` for all future changes
4. Run migrations in CI/CD with `scripts/run-migrations.js`

**Option 2: Hybrid (Not Recommended)**
- Keep legacy system for production
- Use Drizzle for dev only
- Manually sync changes between systems
- High maintenance, error-prone

### For This Branch

Since we're on `feature/migration-consolidation`:
1. Continue with Phase 4-7 to complete the consolidation
2. Test everything locally
3. Merge to main
4. Deploy to production with new Drizzle workflow

---

## Troubleshooting

### "Interactive prompts in CI/CD"
- ❌ Don't use `drizzle-kit push` in CI/CD
- ✅ Use `drizzle-kit generate` + migration runner

### "Schema drift detected"
- In dev: Use `npm run db:reset-dev`
- In prod: Generate migration, review, apply

### "Table already exists" errors
- Check if migration was already applied
- Verify `__drizzle_migrations` table state
- Use idempotent SQL (IF NOT EXISTS)

---

## Files Modified

- `package.json` - Updated db scripts
- `scripts/recreate-dev-db.js` - New
- `scripts/check-db-tables.js` - New
- `lib/database/schema.ts` - Fixed to match production

---

## Success Criteria

✅ Dev database matches production  
✅ App builds successfully  
✅ No data loss  
✅ Clear CI/CD workflow documented  
✅ Reproducible dev environment setup  
⏳ Legacy system removal (Phase 4)  
⏳ Production cutover plan (Phase 7)  

