# Database + Deployment Workflow

This document defines how schema changes propagate through environments (local → preview → production) using **one Neon project** with branches and Vercel.

---

## Environments

### Neon Project: `sales-helper`
- **`main`** → Production database
- **`dev`** → Local development database  
- **`preview/*`** → Auto-created by Vercel for each PR (based on `main`)

### Vercel Project: `sales-helper-app-s2`
- **Preview deployments** → Linked to `preview/*` Neon branches
- **Production deployment** → Linked to `main` Neon branch

### Local Development
- Uses Neon `dev` branch
- Cursor always points to this branch when running migrations/tests

---

## Environment Variables

### Core Variables
- `DATABASE_URL` → Connection string for current Neon branch
- `APP_ENV` → `local | preview | prod`

### Vercel Configuration
- **Production env vars** → `DATABASE_URL` for Neon `main`
- **Preview env vars** → `DATABASE_URL` for Neon `preview/*` (auto-created by integration)
- **Development env vars** → `DATABASE_URL` for Neon `dev`

### Local Development Setup
```bash
# Get connection string for dev branch
export DATABASE_URL=$(neonctl connection-string --project sales-helper --branch dev)
export APP_ENV=local
```

---

## Workflow for Schema Changes

### 1. Start from Main (Always)
Always branch from the latest production state.

```bash
git checkout main
git pull origin main
neonctl branch delete dev --project sales-helper --force   # clean slate if exists
neonctl branch create dev --from main --project sales-helper
```

### 2. Work Locally
Point to Neon dev branch:

```bash
export DATABASE_URL=$(neonctl connection-string --project sales-helper --branch dev)
```

Apply migration manually:

```bash
# Option 1: Using our migration script
npm run db:migrate

# Option 2: Direct SQL (for testing)
psql $DATABASE_URL -f migrations/2025xxxx_add_request_type.sql
```

Run the app locally against this branch and test.

### 3. Commit + Push to Feature Branch
```bash
git checkout -b feature/add-request-type
git add migrations/2025xxxx_add_request_type.sql
git commit -m "Add request_type column"
git push origin feature/add-request-type
```

### 4. Open PR → Vercel Preview
Vercel deploys a Preview build.

Neon auto-creates a `preview/pr-###` branch cloned from main.

Your migration must run against this branch:

```bash
export DATABASE_URL=$(neonctl connection-string --project sales-helper --branch preview/pr-###)
psql $DATABASE_URL -f migrations/2025xxxx_add_request_type.sql
```

Test app at the Preview URL.

### 5. Merge PR → Production
```bash
git checkout main
git pull origin main
git merge feature/add-request-type
git push origin main
```

Vercel deploys to Production (connected to Neon main branch).

Apply the same migration to main:

```bash
export DATABASE_URL=$(neonctl connection-string --project sales-helper --branch main)
psql $DATABASE_URL -f migrations/2025xxxx_add_request_type.sql
```

---

## Rollbacks

### Local/Preview Rollbacks
Just delete the branch and recreate from main.

```bash
neonctl branch delete dev --project sales-helper --force
neonctl branch delete preview/pr-### --project sales-helper --force
```

### Production Rollbacks
Create a new branch from snapshot:

```bash
neonctl branch create rollback-2025xxxx --from main@<snapshot-id>
```

---

## Key Rules

### Migration Management
- ✅ Every schema change is a SQL file in `/migrations`
- ✅ Naming convention: `YYYYMMDDHHMM_description.sql`
- ✅ Never apply changes directly in Neon console
- ✅ Always commit migrations

### Migration Order
Always apply migrations in this order:
1. **Local dev branch**
2. **Preview branch** 
3. **Main branch (prod)**

### Cursor Onboarding
Cursor must read this file before suggesting migrations to avoid skipping steps.

---

## Example: Adding request_type Column

### 1. Create Migration File
```sql
-- migrations/20250116140000_add_request_type.sql
ALTER TABLE requests ADD COLUMN request_type TEXT;
```

### 2. Apply Locally
```bash
export DATABASE_URL=$(neonctl connection-string --project sales-helper --branch dev)
npm run db:migrate
# Test the app locally
```

### 3. Push Feature Branch
```bash
git checkout -b feature/add-request-type
git add migrations/20250116140000_add_request_type.sql
git commit -m "Add request_type column"
git push origin feature/add-request-type
```

### 4. Preview Deployment
```bash
# Get preview branch connection string
export DATABASE_URL=$(neonctl connection-string --project sales-helper --branch preview/pr-123)
npm run db:migrate
# Test at preview URL
```

### 5. Production Deployment
```bash
git checkout main
git merge feature/add-request-type
git push origin main

# Apply to production
export DATABASE_URL=$(neonctl connection-string --project sales-helper --branch main)
npm run db:migrate
```

---

## Automation Scripts

### Environment Setup Script
```bash
#!/bin/bash
# scripts/setup-env.sh

BRANCH=${1:-dev}
PROJECT="sales-helper"

echo "Setting up environment for branch: $BRANCH"

# Get connection string
export DATABASE_URL=$(neonctl connection-string --project $PROJECT --branch $BRANCH)
export APP_ENV=local

echo "DATABASE_URL set for $BRANCH branch"
echo "Run: npm run db:migrate"
```

### Migration Helper
```bash
#!/bin/bash
# scripts/migrate-env.sh

BRANCH=${1:-dev}
PROJECT="sales-helper"

echo "Running migrations on branch: $BRANCH"

export DATABASE_URL=$(neonctl connection-string --project $PROJECT --branch $BRANCH)
npm run db:migrate
```

---

## Troubleshooting

### Common Issues

#### Migration Fails on Preview
- Check if preview branch exists: `neonctl branch list --project sales-helper`
- Recreate preview branch: `neonctl branch create preview/pr-123 --from main --project sales-helper`

#### Connection Issues
- Verify SSL mode: `?sslmode=require` in connection string
- Check Neon console for branch status
- Ensure Vercel environment variables are set correctly

#### Schema Drift
- Compare schemas: `pg_dump --schema-only` on different branches
- Use Neon console to inspect table structures
- Recreate dev branch from main if needed

### Emergency Procedures

#### Production Schema Emergency
1. Create backup branch: `neonctl branch create emergency-backup --from main --project sales-helper`
2. Apply hotfix migration to main
3. Test thoroughly before deploying

#### Rollback Production
1. Identify snapshot before issue: `neonctl branch list --project sales-helper`
2. Create rollback branch: `neonctl branch create rollback-YYYYMMDD --from main@<snapshot> --project sales-helper`
3. Update Vercel to use rollback branch temporarily
4. Fix and redeploy

---

## Integration with Vercel

### Automatic Branch Creation
Neon + Vercel integration automatically creates preview branches for each PR.

### Environment Variables in Vercel
- **Production**: `DATABASE_URL` → Neon `main` branch
- **Preview**: `DATABASE_URL` → Neon `preview/*` branches
- **Development**: `DATABASE_URL` → Neon `dev` branch

### Deployment Hooks
Consider adding deployment hooks to automatically run migrations:

```bash
# In Vercel deployment script
if [ "$VERCEL_ENV" = "production" ]; then
  export DATABASE_URL=$(neonctl connection-string --project sales-helper --branch main)
  npm run db:migrate
elif [ "$VERCEL_ENV" = "preview" ]; then
  export DATABASE_URL=$(neonctl connection-string --project sales-helper --branch preview/$VERCEL_GIT_PULL_REQUEST_ID)
  npm run db:migrate
fi
```

---

## Best Practices

### Development
- ✅ Always start from `main` branch
- ✅ Test migrations locally before pushing
- ✅ Use descriptive migration names
- ✅ Include rollback SQL in comments

### Deployment
- ✅ Apply migrations in order: local → preview → production
- ✅ Test thoroughly in preview environment
- ✅ Monitor migration execution in Neon console
- ✅ Keep backup branches for critical changes

### Monitoring
- ✅ Check Neon console for branch status
- ✅ Monitor Vercel deployment logs
- ✅ Verify schema changes in each environment
- ✅ Test application functionality after migrations
