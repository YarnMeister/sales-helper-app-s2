# DATABASE MIGRATIONS

**Last Updated:** October 2, 2025  
**Status:** Active - WebSocket-Only System

---

## THE ONE RULE

**Always use Drizzle Kit with WebSocket driver. No exceptions.**

- **One driver:** WebSocket (Neon Pool)
- **One workflow:** Edit schema → Generate → Migrate
- **One location:** `lib/database/migrations/` (Drizzle-managed)
- **One runner:** `scripts/migrate-websocket.ts`

---

## The 3-Step Workflow

### Step 1: Edit Schema

Edit `lib/database/schema.ts` to define your changes:

```typescript
// Example: Add a new table
export const myNewTable = pgTable('my_new_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### Step 2: Generate Migration

```bash
npm run db:generate
```

This creates:
- `lib/database/migrations/XXXX_description.sql` - The migration SQL
- Updates `lib/database/migrations/meta/_journal.json` - Migration tracking

**Review the generated SQL before proceeding!**

### Step 3: Apply Migration

```bash
npm run db:migrate
```

This runs all pending migrations using WebSocket driver.

**Done!** That's the entire workflow.

---

## Pre-Deployment Checklist

Before committing schema changes:

- [ ] Run `npm run db:generate` to create migration
- [ ] Review generated SQL in `lib/database/migrations/XXXX_*.sql`
- [ ] Run `npm run db:validate-migrations` to check integrity
- [ ] Run `npm run db:migrate` to test migration locally
- [ ] Commit both `schema.ts` and generated migration files
- [ ] Push to remote - build will validate migrations

---

## What NOT to Do

### ❌ Never manually create SQL files

```bash
# WRONG - Don't do this
touch lib/database/migrations/0003_my_migration.sql
```

**Why:** Drizzle Kit manages migration files and journal. Manual files break tracking.

### ❌ Never edit generated migration files

```bash
# WRONG - Don't do this
vim lib/database/migrations/0002_*.sql  # and make changes
```

**Why:** Migrations should match schema.ts. If SQL is wrong, fix schema.ts and regenerate.

### ❌ Never use `drizzle-kit push`

```bash
# WRONG - This is disabled
npm run db:push
```

**Why:** Push bypasses migration tracking. Always use generate → migrate workflow.

### ❌ Never create migrations in other folders

```bash
# WRONG - Don't do this
mkdir migrations/
touch migrations/001_my_migration.sql
```

**Why:** `lib/database/migrations/` is the ONLY migrations folder. Others will be ignored.

### ❌ Never use HTTP driver for migrations

```typescript
// WRONG - Don't do this
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
```

**Why:** HTTP driver can't execute multi-statement SQL. Use WebSocket (Pool) instead.

---

## Troubleshooting

### Problem: "Journal file not found"

**Solution:** Run `npm run db:generate` to create initial migration.

### Problem: "Missing SQL file for journal entry"

**Cause:** Journal references a migration file that doesn't exist.

**Solution:** 
1. Check `lib/database/migrations/meta/_journal.json`
2. Remove orphaned entries or restore missing SQL files
3. Run `npm run db:validate-migrations` to verify

### Problem: "Orphaned SQL file (not in journal)"

**Cause:** SQL file exists but isn't tracked in journal.

**Solution:**
1. Delete the orphaned SQL file
2. If you need the migration, fix `schema.ts` and run `npm run db:generate`

### Problem: "CREATE statement without IF NOT EXISTS"

**Cause:** Generated migration may not be idempotent.

**Solution:**
- This is usually OK for new tables
- For production safety, consider adding `IF NOT EXISTS` manually
- Or use Drizzle's built-in idempotency features

### Problem: Migration fails in production

**Cause:** Schema mismatch or SQL error.

**Solution:**
1. Check production logs for specific error
2. Verify `schema.ts` matches production schema
3. Test migration locally first
4. Consider creating a rollback migration

---

## For AI Assistants

When working with database schema changes:

1. **Always ask before making schema changes** - Database changes are high-risk
2. **Follow the 3-step workflow** - No shortcuts, no manual SQL
3. **Validate before committing** - Run `npm run db:validate-migrations`
4. **Never delete migration files** - Migrations are append-only
5. **Test locally first** - Run `npm run db:migrate` before pushing

### Common Scenarios

**Scenario: User asks to add a new table**

```bash
# 1. Edit lib/database/schema.ts (add table definition)
# 2. Generate migration
npm run db:generate
# 3. Validate
npm run db:validate-migrations
# 4. Apply locally
npm run db:migrate
# 5. Commit all changes
git add lib/database/schema.ts lib/database/migrations/
git commit -m "feat: Add new table"
```

**Scenario: User asks to modify existing table**

```bash
# 1. Edit lib/database/schema.ts (modify table definition)
# 2. Generate migration
npm run db:generate
# 3. Review generated SQL carefully (may include DROP/ALTER)
# 4. Validate
npm run db:validate-migrations
# 5. Apply locally
npm run db:migrate
# 6. Commit all changes
```

**Scenario: User asks to rollback a migration**

```bash
# Migrations are append-only - create a new migration to undo changes
# 1. Edit schema.ts to reverse the change
# 2. Generate new migration
npm run db:generate
# 3. Apply
npm run db:migrate
```

---

## System Architecture

### Database Driver: WebSocket (Neon Pool)

**File:** `lib/database/connection-standard.ts`

```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws as any;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
```

**Why WebSocket:**
- Supports multi-statement SQL (required for complex migrations)
- Full PostgreSQL transaction support
- Works with Drizzle's migration system
- No limitations on SQL complexity

### Migration Runner: WebSocket-Based

**File:** `scripts/migrate-websocket.ts`

Uses `drizzle-orm/neon-serverless/migrator` with WebSocket Pool.

### Migration Validation: Pre-Deployment

**File:** `scripts/validate-migrations.ts`

Runs automatically before build:
- Validates journal integrity
- Checks for orphaned files
- Basic idempotency checks

---

## Migration History

- **Oct 2, 2025:** Implemented WebSocket-only migration system
  - Retired legacy dual-system (HTTP + manual migrations)
  - Established `lib/database/migrations/` as single source of truth
  - Added automated validation and pre-build checks

---

## Questions?

If you're unsure about a migration:
1. Ask the user before proceeding
2. Test locally first
3. Review generated SQL carefully
4. Consider the impact on production data

**When in doubt, ask!**

