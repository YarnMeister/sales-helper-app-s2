# Bulletproof Migration Policy

## 🎯 **Goal: Zero Migration Conflicts**

This document establishes a bulletproof migration system that prevents the `db:push` vs `db:migrate` split that caused our recent issues.

## 🚫 **What's Banned**

### **1. `db:push` Command**
- **Status**: ❌ **DISABLED**
- **Reason**: Bypasses migration tracking, creates state inconsistencies
- **Alternative**: Use `npm run db:migrate` instead

### **2. Mixed Connection Methods**
- **Status**: ❌ **FORBIDDEN**
- **Banned**: Mixing `drizzle-orm/node-postgres` and `@neondatabase/serverless`
- **Standard**: ALL scripts must use `lib/database/connection-standard.ts`

### **3. Manual Migration Tracking**
- **Status**: ❌ **FORBIDDEN**
- **Banned**: Manually inserting into `__drizzle_migrations` table
- **Alternative**: Use `npm run db:sync` for state synchronization

## ✅ **What's Required**

### **1. Standard Connection Module**
```typescript
// ✅ CORRECT - Use standard connection
import { createStandardConnection } from '../lib/database/connection-standard.js';

// ❌ WRONG - Direct connection creation
import { neon } from '@neondatabase/serverless';
```

### **2. Unified Migration Command**
```bash
# ✅ CORRECT - Always use unified migration
npm run db:migrate

# ❌ WRONG - Bypasses tracking
npm run db:push
```

### **3. Schema Change Workflow**
```bash
# 1. Edit schema
vim lib/database/schema.ts

# 2. Generate migration
npm run db:generate

# 3. Review generated SQL
cat lib/database/migrations/0003_*.sql

# 4. Apply migration
npm run db:migrate

# 5. Commit both schema and migration files
git add lib/database/schema.ts lib/database/migrations/
git commit -m "feat: add new table"
```

## 🔧 **Available Commands**

### **Core Commands**
- `npm run db:migrate` - Run pending migrations (bulletproof)
- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:studio` - Open Drizzle Studio GUI
- `npm run db:sync` - Sync migration tracking with database state

### **Emergency Commands**
- `npm run db:reset-dev` - Nuclear option: recreate dev database
- `npm run db:migrate --force` - Force migration even if errors occur

## 🛡️ **How It Prevents Issues**

### **1. Consistent Connections**
- All scripts use `@neondatabase/serverless` via standard connection module
- No more connection method mismatches
- Guaranteed to see the same database state

### **2. Automatic State Sync**
- Unified migration system detects when `db:push` was used previously
- Automatically syncs migration tracking with actual database state
- Prevents "migration table doesn't exist" errors

### **3. Migration Tracking**
- Every schema change is tracked in `__drizzle_migrations` table
- Migration files are version controlled
- Rollback capability maintained

## 🚨 **Emergency Recovery**

If you encounter migration issues:

### **1. State Mismatch**
```bash
# Sync migration tracking with database state
npm run db:sync
```

### **2. Corrupted Migration State**
```bash
# Reset dev database and apply all migrations
npm run db:reset-dev
```

### **3. Production Issues**
```bash
# Force migration (use with extreme caution)
npm run db:migrate --force
```

## 📋 **Migration Checklist**

Before making schema changes:
- [ ] Schema changes are in `lib/database/schema.ts`
- [ ] Migration generated with `npm run db:generate`
- [ ] Migration reviewed and looks correct
- [ ] Migration tested locally with `npm run db:migrate`
- [ ] Both schema and migration files committed to git

## 🔍 **Monitoring**

### **Check Migration Status**
```bash
# View applied migrations
node scripts/check-drizzle-migrations.js

# Verify database connection
npm run db:migrate --sync-only
```

### **Verify Consistency**
```bash
# Ensure all scripts use standard connection
grep -r "neon(" scripts/ lib/ --include="*.js" --include="*.ts"
# Should only find references in connection-standard.ts
```

## 🎯 **Success Metrics**

This policy is successful when:
- ✅ Zero "migration table doesn't exist" errors
- ✅ All developers use the same migration workflow
- ✅ Database state is always consistent across environments
- ✅ Migration conflicts are impossible

## 📚 **References**

- [Drizzle Kit Documentation](https://orm.drizzle.team/docs/drizzle-kit-push)
- [Migration Best Practices](./project_config.md)
- [Database Connection Standard](../lib/database/connection-standard.ts)
- [Unified Migration System](../scripts/unified-migrate.js)
