# Database Migrations - WebSocket System

## THE ONE RULE

**Always use Drizzle Kit with WebSocket driver for migrations. Never manually edit migration files or tracking tables.**

## The 3-Step Workflow

### 1. Edit Schema
```bash
# Edit lib/database/schema.ts with your changes
```

### 2. Generate Migration
```bash
npm run db:generate
# Creates SQL file in lib/database/migrations/
# Auto-generates migration name (e.g., 0003_fancy_spider.sql)
```

### 3. Run Migration
```bash
npm run db:migrate
# Runs pending migrations using WebSocket driver
```

## System Architecture

### Single Migration Folder
- **Location**: `lib/database/migrations/`
- **Configured in**: `drizzle.config.ts` (`out: './lib/database/migrations'`)
- **Contains**: SQL files + `meta/_journal.json`

### Single Migration Runner
- **Script**: `scripts/migrate-websocket.ts`
- **Command**: `npm run db:migrate`
- **Driver**: Neon WebSocket (`@neondatabase/serverless` with `Pool`)
- **Why WebSocket**: Supports multi-statement SQL (HTTP driver doesn't)

### Migration Tracking Table
- **Table**: `drizzle.__drizzle_migrations` (in `drizzle` schema, not `public`)
- **Columns**: `id` (serial), `hash` (text), `created_at` (bigint)
- **Managed by**: Drizzle ORM automatically
- **Never edit manually**: Drizzle handles all tracking

### Migration Journal
- **File**: `lib/database/migrations/meta/_journal.json`
- **Purpose**: Tracks migration metadata (timestamps, tags, versions)
- **Managed by**: `drizzle-kit generate` automatically
- **Only edit when**: Removing orphaned entries (rare)

## How It Works

### Migration Generation
```bash
npm run db:generate
```
1. Drizzle Kit reads `lib/database/schema.ts`
2. Compares with current database state
3. Generates SQL migration file in `lib/database/migrations/`
4. Updates `meta/_journal.json` with metadata
5. Assigns sequential number (0000, 0001, 0002, etc.)

### Migration Execution
```bash
npm run db:migrate
```
1. WebSocket runner connects to database
2. Queries `drizzle.__drizzle_migrations` for last applied migration
3. Reads `meta/_journal.json` for pending migrations
4. Executes pending migrations in order
5. Records each migration in `drizzle.__drizzle_migrations`

### Migration Tracking Logic
- Drizzle compares `created_at` timestamps (not hashes)
- Runs migrations where `journal.when > lastMigration.created_at`
- Hash is stored for reference but not used for comparison
- Each migration runs exactly once

## Pre-Deployment Checklist

Before merging to main:

1. ✅ **Schema changes committed**: `lib/database/schema.ts`
2. ✅ **Migration generated**: SQL file in `lib/database/migrations/`
3. ✅ **Journal updated**: `meta/_journal.json` has new entry
4. ✅ **Local test passed**: `npm run db:migrate` succeeded locally
5. ✅ **Build passes**: `npm run build` completes without errors
6. ✅ **Tests pass**: `npm test` all green

## What NOT to Do

### ❌ NEVER use `db:push`
```bash
npm run db:push  # DISABLED - will error
```
- Bypasses migration system
- No migration history
- Can't rollback
- Breaks production

### ❌ NEVER edit applied migrations
```bash
# If migration 0001 is already applied, DON'T edit:
lib/database/migrations/0001_add_users.sql
```
- Create new migration instead
- Applied migrations are immutable

### ❌ NEVER manually edit tracking table
```sql
-- DON'T DO THIS:
INSERT INTO drizzle.__drizzle_migrations ...
UPDATE drizzle.__drizzle_migrations ...
DELETE FROM drizzle.__drizzle_migrations ...
```
- Drizzle manages this automatically
- Manual edits break migration logic

### ❌ NEVER use HTTP driver for migrations
```typescript
// DON'T DO THIS:
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
```
- HTTP driver can't execute multi-statement SQL
- Use WebSocket Pool instead

### ❌ NEVER create multiple migration folders
```bash
# DON'T DO THIS:
migrations/           # Old location
lib/database/migrations/  # Current location
```
- Single source of truth: `lib/database/migrations/`
- Configured in `drizzle.config.ts`

## For AI Assistants

### When User Asks for Schema Changes

1. **Edit schema first**:
   ```typescript
   // lib/database/schema.ts
   export const newTable = pgTable('new_table', {
     id: serial('id').primaryKey(),
     name: text('name').notNull()
   });
   ```

2. **Generate migration**:
   ```bash
   npm run db:generate
   ```

3. **Review generated SQL**:
   ```bash
   cat lib/database/migrations/0003_*.sql
   ```

4. **Test locally**:
   ```bash
   npm run db:migrate
   npm run build
   npm test
   ```

5. **Commit everything**:
   ```bash
   git add lib/database/schema.ts
   git add lib/database/migrations/
   git commit -m "feat: Add new_table for feature X"
   ```

### When Migration Fails

1. **Check error message** - usually indicates SQL syntax or constraint issue
2. **Review generated SQL** - ensure it matches intent
3. **Check database state** - verify current schema
4. **Fix schema.ts** - correct the issue
5. **Generate new migration** - don't edit existing one
6. **Test again** - verify fix works

### When User Wants to Rollback

**Drizzle doesn't support automatic rollback.** Manual process:

1. Write reverse SQL manually
2. Execute in database
3. Remove migration entry from `drizzle.__drizzle_migrations`
4. Remove migration file and journal entry
5. **Better approach**: Create new migration to undo changes

## Environment-Specific Notes

### Development
- Uses dev database instance
- Safe to experiment
- Can reset with `npm run db:reset-dev` (if available)

### Production
- Migrations run automatically during Vercel deployment
- Build command: `npm run db:migrate && npm run build`
- Failures block deployment (good!)
- Always test locally first

## Troubleshooting

### "Migration already applied" error
- Migration hash/timestamp already in `drizzle.__drizzle_migrations`
- Usually means migration ran successfully before
- Check database state to verify

### "No file found" error
- Journal references migration file that doesn't exist
- Remove orphaned entry from `meta/_journal.json`
- Regenerate migration if needed

### "WebSocket connection failed" error
- Check `DATABASE_URL` environment variable
- Verify database is accessible
- Check Neon database status

### "Multi-statement SQL not supported" error
- You're using HTTP driver instead of WebSocket
- Check `scripts/migrate-websocket.ts` uses `Pool`
- Verify `neonConfig.webSocketConstructor = ws`

## Key Files Reference

```
lib/database/
├── schema.ts                    # Single source of truth for schema
├── migrations/                  # Migration folder (Drizzle managed)
│   ├── 0000_mighty_reaper.sql
│   ├── 0001_add_index.sql
│   └── meta/
│       └── _journal.json        # Migration metadata

scripts/
└── migrate-websocket.ts         # WebSocket migration runner

drizzle.config.ts                # Drizzle Kit configuration
package.json                     # npm scripts (db:migrate, db:generate)
tsconfig.json                    # Excludes migrate-websocket.ts
```

## Summary

- **One folder**: `lib/database/migrations/`
- **One runner**: `scripts/migrate-websocket.ts`
- **One command**: `npm run db:migrate`
- **One table**: `drizzle.__drizzle_migrations`
- **One driver**: WebSocket (Neon Pool)
- **One workflow**: Edit schema → Generate → Migrate

