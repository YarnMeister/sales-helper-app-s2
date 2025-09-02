# Database + Deployment Workflow

This document defines how schema changes propagate through environments (local → preview → production) using **one Neon project** with branches and Vercel.

---

## Environments

### Neon Project: `sales-helper-db`
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
export DATABASE_URL=$(neonctl connection-string --project sales-helper-db --branch dev)
export APP_ENV=local
```

---

## Workflow for Schema Changes

### 1. Start from Main (Always)
Always branch from the latest production state.

```bash
git checkout main
git pull origin main
neonctl branch delete dev --project sales-helper-db --force   # clean slate if exists
neonctl branch create dev --from main --project sales-helper-db
```

### 2. Work Locally
Point to Neon dev branch:

```bash
export DATABASE_URL=$(neonctl connection-string --project sales-helper-db --branch dev)
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
export DATABASE_URL=$(neonctl connection-string --project sales-helper-db --branch preview/pr-###)
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
export DATABASE_URL=$(neonctl connection-string --project sales-helper-db --branch main)
npm run db:migrate
```

---

## Rollbacks

### Local/Preview Rollbacks
Just delete the branch and recreate from main.

```bash
neonctl branch delete dev --project sales-helper-db --force
neonctl branch delete preview/pr-### --project sales-helper-db --force
```

### Production Rollbacks
Create a new branch from snapshot:

```bash
neonctl branch create rollback-2025xxxx --from main@<snapshot-id> --project sales-helper-db
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
export DATABASE_URL=$(neonctl connection-string --project sales-helper-db --branch dev)
npm run db:migrate
# Test the app locally
```

### 3. Push Feature Branch
```bash
git checkout -b feature/add-request-type
git add migrations/2025xxxx_add_request_type.sql
git commit -m "Add request_type column"
git push origin feature/add-request-type
```

### 4. Preview Deployment
```bash
# Get preview branch connection string
export DATABASE_URL=$(neonctl connection-string --project sales-helper-db --branch preview/pr-123)
npm run db:migrate
# Test at preview URL
```

### 5. Production Deployment
```bash
git checkout main
git merge feature/add-request-type
git push origin main

# Apply to production
export DATABASE_URL=$(neonctl connection-string --project sales-helper-db --branch main)
npm run db:migrate
```

---

## Automation Scripts

### Environment Setup Script
```bash
#!/bin/bash
# scripts/setup-env.sh

BRANCH=${1:-dev}
PROJECT="sales-helper-db"

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
PROJECT="sales-helper-db"

echo "Running migrations on branch: $BRANCH"

export DATABASE_URL=$(neonctl connection-string --project $PROJECT --branch $BRANCH)
npm run db:migrate
```

---

## Troubleshooting

### Common Issues

#### Migration Fails on Preview
- Check if preview branch exists: `neonctl branch list --project sales-helper-db`
- Recreate preview branch: `neonctl branch create preview/pr-123 --from main --project sales-helper-db`

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
1. Create backup branch: `neonctl branch create emergency-backup --from main --project sales-helper-db`
2. Apply hotfix migration to main
3. Test thoroughly before deploying

#### Rollback Production
1. Identify snapshot before issue: `neonctl branch list --project sales-helper-db`
2. Create rollback branch: `neonctl branch create rollback-YYYYMMDD --from main@<snapshot> --project sales-helper-db`
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
  export DATABASE_URL=$(neonctl connection-string --project sales-helper-db --branch main)
  npm run db:migrate
elif [ "$VERCEL_ENV" = "preview" ]; then
  export DATABASE_URL=$(neonctl connection-string --project sales-helper-db --branch preview/$VERCEL_GIT_PULL_REQUEST_ID)
  npm run db:migrate
fi
```

---

## Phase 1 Implementation Plan: Core Infrastructure Separation

### Overview
Phase 1 focuses on establishing the foundational infrastructure that will support the modular architecture. The goal is to create clear separation of concerns while maintaining 100% backward compatibility and ensuring no feature regression.

**Timeline**: 2 weeks (Weeks 1-2)
**Risk Level**: Low (infrastructure changes only)
**Testing Strategy**: Comprehensive test coverage with regression validation

### Current State Assessment

✅ **Already Completed**:
- Database core utilities (`lib/database/core/`)
- Base repository pattern implementation
- Database connection management
- Basic database utilities

❌ **Immediate Issues to Address**:
- Test suite has 76 failures (15% failure rate)
- Mock configuration conflicts between tests
- Missing shared type definitions
- No authentication infrastructure

### Implementation Timeline

#### Week 1: Foundation & Testing
- **Days 1-3**: Fix test infrastructure and mock conflicts
- **Days 4-5**: Implement shared type definitions
- **Days 6-7**: Set up authentication infrastructure

#### Week 2: Enhancement & Validation
- **Days 1-3**: Enhance database core infrastructure
- **Days 4-5**: Implement environment configuration management
- **Days 6-7**: Comprehensive testing and validation

### Detailed Implementation Steps

#### 1.1 Fix Critical Test Infrastructure (Week 1, Days 1-3)

**Priority**: CRITICAL - Fix Test Mock Conflicts

**Problem**: Tests are failing due to improper mock configuration and isolation issues.

**Solution**: Implement the test playbook's strict mock hierarchy:

```typescript
// tests/setup.ts - ENHANCE EXISTING
export const mockUseRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/'
};

// Ensure ALL tests use this mock
vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({})
}));
```

**Changes Required**:
1. Update `tests/setup.ts` with comprehensive mock configuration
2. Remove all test-specific router mock overrides
3. Implement proper test isolation with `beforeEach`/`afterEach` cleanup
4. Fix Redis mock configuration for cache tests

**Files to Modify**:
- `tests/setup.ts`
- All failing test files to remove mock overrides
- `tests/_utils/test-helpers.ts`

**Success Criteria**: Test failure rate drops from 15% to <5%

#### 1.2 Complete Shared Type Definitions (Week 1, Days 4-5)

**Priority**: HIGH - Establish Type Foundation

**Problem**: Missing shared type definitions causing type conflicts across features.

**Solution**: Create comprehensive shared type system:

```typescript
// types/shared/database.ts
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseConfig {
  env: string;
  tablePrefix: string;
  databaseUrl: string;
}

// types/shared/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// types/shared/ui.ts
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'textarea';
  required?: boolean;
  validation?: ValidationRule[];
}
```

**Changes Required**:
1. Create `types/shared/` directory structure
2. Implement core type definitions
3. Update existing components to use shared types
4. Add type validation utilities

**Files to Create**:
- `types/shared/database.ts`
- `types/shared/api.ts`
- `types/shared/ui.ts`
- `types/shared/common.ts`
- `types/shared/environment.ts`

**Success Criteria**: All TypeScript compilation errors resolved, consistent type usage across codebase

#### 1.3 Implement Authentication Infrastructure (Week 1, Days 6-7)

**Priority**: HIGH - Security Foundation

**Problem**: No authentication system for API protection and user management.

**Solution**: Implement NextAuth.js with Google Workspace integration:

```typescript
// lib/core/auth/nextauth-config.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Restrict to Google Workspace domain
      if (profile?.email?.endsWith('@yourcompany.com')) {
        return true;
      }
      return false;
    }
  }
};

// lib/core/auth/middleware.ts
export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return handler(req, res);
  };
}
```

**Changes Required**:
1. Install NextAuth.js dependencies
2. Create authentication configuration
3. Implement API route protection middleware
4. Add environment variable validation
5. Create authentication-aware UI components

**Files to Create**:
- `lib/core/auth/nextauth-config.ts`
- `lib/core/auth/middleware.ts`
- `lib/core/auth/session.ts`
- `lib/core/auth/permissions.ts`
- `app/api/auth/[...nextauth]/route.ts`

**Success Criteria**: All API routes protected, Google Workspace authentication working, session management functional

#### 1.4 Enhance Database Core Infrastructure (Week 2, Days 1-3)

**Priority**: MEDIUM - Database Foundation

**Problem**: Base repository needs transaction support and better error handling.

**Solution**: Enhance existing database core with advanced features:

```typescript
// lib/database/core/transaction.ts
export class TransactionManager {
  static async execute<T>(
    operations: (sql: any) => Promise<T>[],
    rollbackOnError: boolean = true
  ): Promise<T[]> {
    try {
      const results = await Promise.all(operations(getDatabaseConnection()));
      return results;
    } catch (error) {
      if (rollbackOnError) {
        // Log rollback for audit purposes
        console.error('Transaction rolled back:', error);
      }
      throw error;
    }
  }
}

// lib/database/core/validation.ts
export class DatabaseValidator {
  static validateEntity<T extends BaseEntity>(entity: Partial<T>): ValidationResult {
    const errors: string[] = [];
    
    if (!entity.id && entity.id !== undefined) {
      errors.push('ID is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

**Changes Required**:
1. Enhance `BaseRepository` with transaction support
2. Add comprehensive error handling
3. Implement database validation utilities
4. Create database migration utilities
5. Add performance monitoring

**Files to Enhance**:
- `lib/database/core/repository.ts`
- `lib/database/core/connection.ts`
- `lib/database/core/utils.ts`

**Files to Create**:
- `lib/database/core/transaction.ts`
- `lib/database/core/validation.ts`
- `lib/database/core/migrations.ts`

**Success Criteria**: Database operations are more robust, better error handling, transaction support available

#### 1.5 Environment Configuration Management (Week 2, Days 4-5)

**Priority**: MEDIUM - Configuration Foundation

**Problem**: Environment configuration scattered across multiple files.

**Solution**: Centralized environment management:

```typescript
// lib/core/config/environment.ts
export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private loadConfiguration(): EnvironmentConfig {
    return {
      app: {
        env: process.env.APP_ENV || 'development',
        port: parseInt(process.env.PORT || '3000'),
        url: process.env.NEXTAUTH_URL || 'http://localhost:3000'
      },
      database: {
        url: process.env.DATABASE_URL!,
        ssl: process.env.NODE_ENV === 'production'
      },
      auth: {
        secret: process.env.NEXTAUTH_SECRET!,
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        }
      }
    };
  }

  getConfig(): EnvironmentConfig {
    return this.config;
  }
}
```

**Changes Required**:
1. Create centralized environment configuration
2. Implement environment validation
3. Add configuration caching
4. Create feature-specific configuration schemas
5. Add configuration testing utilities

**Files to Create**:
- `lib/core/config/environment.ts`
- `lib/core/config/validation.ts`
- `lib/core/config/schemas.ts`
- `lib/core/config/testing.ts`

**Success Criteria**: Centralized configuration management, environment validation working, configuration testing available

### Feature Regression Prevention Strategy

#### 1. Comprehensive Testing Approach

**Test Coverage Requirements**:
- **Unit Tests**: Maintain 90%+ coverage
- **Integration Tests**: Add tests for all API endpoints
- **Regression Tests**: Test all existing user workflows
- **Performance Tests**: Ensure no performance degradation

#### 2. Backward Compatibility Assurance

**API Versioning Strategy**:
- Maintain existing API endpoints during transition
- Add new v1 endpoints alongside existing ones
- Implement gradual deprecation process
- Add compatibility layer for old endpoints

**Database Migration Strategy**:
- Use database views for backward compatibility
- Implement feature flags for new functionality
- Add rollback procedures for all changes
- Test migrations on production-like data

#### 3. Monitoring and Validation

**Performance Monitoring**:
```typescript
// lib/core/monitoring/performance.ts
export class PerformanceMonitor {
  static async measureOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      // Log performance metrics
      console.log(`Operation ${operationName} completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Operation ${operationName} failed after ${duration}ms:`, error);
      throw error;
    }
  }
}
```

**Health Checks**:
- Add health check endpoints for all services
- Implement circuit breakers for external dependencies
- Add comprehensive logging for debugging
- Create monitoring dashboard for production

### Success Metrics

#### Phase 1 Success Criteria
1. **Test Stability**: Test failure rate <5% (currently 15%)
2. **Type Safety**: 0 TypeScript compilation errors
3. **Authentication**: 100% API route protection
4. **Performance**: No performance regression
5. **Code Quality**: Improved maintainability scores

#### Validation Checklist
- [ ] All existing tests passing
- [ ] New infrastructure tests added
- [ ] Authentication working end-to-end
- [ ] Performance benchmarks maintained
- [ ] Documentation updated
- [ ] Code review completed

### Risk Mitigation

#### Technical Risks
1. **Test Instability**: Implement comprehensive mock hierarchy
2. **Type Conflicts**: Use strict TypeScript configuration
3. **Performance Impact**: Add performance monitoring
4. **Authentication Issues**: Implement fallback mechanisms

#### Business Risks
1. **Feature Regression**: Comprehensive regression testing
2. **Development Velocity**: Parallel development approach
3. **User Experience**: Gradual rollout with feature flags

### Next Steps

1. **Immediate**: Fix test infrastructure (Week 1, Days 1-3)
2. **Short-term**: Complete Phase 1 implementation (Week 2)
3. **Medium-term**: Begin Phase 2 feature extraction
4. **Long-term**: Complete modularization and prepare for future features

This Phase 1 implementation provides the solid foundation needed for the modular architecture while ensuring no feature regression and maintaining development velocity. The focus on testing, type safety, and authentication creates a robust platform for future feature development.


