# Drizzle ORM Refactoring Plan (Feature-Based Architecture)

## Executive Summary

This document outlines a comprehensive plan to refactor all legacy raw SQL in `lib/db.ts` (610 lines) to use Drizzle ORM exclusively **while aligning with the feature-based architecture modularization plan** (specs/architecture-modularization-plan.md).

**Current State:**
- `lib/db.ts` contains 610 lines of raw SQL queries using tagged template literals
- 18 API routes and multiple files import functions from `lib/db.ts`
- A partial repository system exists in `lib/database/repositories/` but only handles `requests`, `site_visits`, and `pipedrive_submissions` tables
- Legacy adapter (`lib/database/adapters/legacy-adapter.ts`) provides backward compatibility for request operations only

**Target State (Aligned with Architecture Plan):**
- All database operations use Drizzle ORM with type-safe query builders
- **Feature-based repository organization**: `lib/database/features/{feature-name}/repository.ts`
- Zero raw SQL queries (except for complex edge cases if absolutely necessary)
- Consistent error handling through `RepositoryResult<T>` pattern
- All API routes use repository interfaces instead of direct SQL
- **Full alignment with specs/architecture-modularization-plan.md Section 2 (Database Layer)**

---

## Current Analysis

### Tables in lib/db.ts Requiring Migration

Based on the analysis of `lib/db.ts`, the following table groups need migration:

#### 1. **Requests Table** (Lines 13-205)
**Status:** ✅ Partially Migrated (repository exists, legacy adapter provides compatibility)
- `createRequest` - ✅ Covered by `SalesRequestsRepository.create()`
- `addLineItemAtomic` - ✅ Covered by `legacy-adapter.ts`
- `updateRequest` - ✅ Covered by `SalesRequestsRepository.update()`
- `getRequestById` - ✅ Covered by `SalesRequestsRepository.findById()`
- `getRequests` - ✅ Covered by `SalesRequestsRepository.search()`
- `deleteRequest` - ✅ Covered by `SalesRequestsRepository.delete()`

**Action Required:** None for core operations, but atomic line item addition should be enhanced in repository

#### 2. **Pipedrive Flow Data Tables** (Lines 210-443)
**Status:** ❌ Not Migrated - All raw SQL

##### pipedrive_deal_flow_data table:
- `insertDealFlowData` (Lines 211-282) - Bulk insert with ON CONFLICT handling
- `getDealFlowData` (Lines 323-336) - Query with optional deal_id filter
- `getDealsForMetric` (Lines 351-443) - Complex CTE query for metric calculations

##### pipedrive_metric_data table:
- `insertDealMetadata` (Lines 284-321) - Upsert operation

**Repository Needed:** `FlowDataRepository` or `PipedriveDealFlowRepository`

#### 3. **Flow Metrics Config Table** (Lines 446-609)
**Status:** ⚠️ Partially Migrated (one function uses Drizzle, rest use raw SQL)

- `getFlowMetricsConfig` (Lines 446-455) - ❌ Raw SQL
- `getActiveFlowMetricsConfig` (Lines 457-494) - ✅ Uses Drizzle ORM (good example!)
- `getFlowMetricConfig` (Lines 496-510) - ❌ Raw SQL
- `createFlowMetricConfig` (Lines 512-543) - ❌ Raw SQL
- `updateFlowMetricConfig` (Lines 545-577) - ❌ Raw SQL
- `deleteFlowMetricConfig` (Lines 579-592) - ❌ Raw SQL
- `reorderFlowMetrics` (Lines 594-609) - ❌ Raw SQL

**Repository Needed:** `FlowMetricsConfigRepository`

### Import Usage Analysis

The following files import from `lib/db.ts` and will need updates:

#### API Routes (11 files):
1. `app/features/flow-metrics/api/metrics/route.ts` - Uses `getActiveFlowMetricsConfig`, `getDealsForMetric`
2. `app/features/flow-metrics/api/config/reorder/route.ts` - Uses `reorderFlowMetrics`
3. `app/features/flow-metrics/api/config/[id]/comment/route.ts` - Uses `updateFlowMetricConfig`
4. `app/api/pipedrive/deal-flow-data/route.ts` - Uses `insertDealFlowData`, `getDealFlowData`
5. `app/api/admin/flow-metrics-config/reorder/route.ts` - Uses `reorderFlowMetrics`
6. `app/api/admin/flow-metrics-config/[id]/comment/route.ts` - Uses `updateFlowMetricConfig`
7. `app/api/requests/route.ts` - Uses legacy adapter (✅ already migrated pattern)
8. `app/api/submit/route.ts` - Likely uses request functions
9. `app/api/pipedrive-webhook/route.ts` - Uses `insertDealFlowData`
10. `app/api/flow/canonical-stage-deals/route.ts` - Uses flow metrics functions
11. `app/api/pipedrive/deal-flow/route.ts` - Uses flow data functions

#### Library Files (2 files):
1. `lib/queries/requests.ts` - Deprecated wrapper functions
2. `lib/queries/mock-submissions.ts` - Mock submission queries

#### Test Files:
1. `tests/unit/line-items-atomic.test.ts` - Tests atomic operations

---

## Migration Strategy

### Phase 1: Create Repository Infrastructure ✅ (Already Exists)

The foundation is solid:
- ✅ Base repository pattern in `lib/database/core/base-repository.ts`
- ✅ Repository factory in `lib/database/core/repository-factory.ts`
- ✅ `RepositoryResult<T>` error handling pattern
- ✅ Schema definitions in `lib/database/schema.ts`
- ✅ WebSocket connection infrastructure

### Phase 2: Reorganize to Feature-Based Architecture (2-3 hours)

#### 2.1 Reorganize Existing Repositories
**Current Structure:**
```
lib/database/repositories/
├── sales-requests-repository.ts
└── (site-visits and pipedrive-submissions in same file)
```

**New Structure (Per Architecture Plan):**
```
lib/database/features/
├── sales-requests/
│   ├── repository.ts         # SalesRequestsRepository
│   ├── types.ts             # Request-specific types
│   └── index.ts             # Public exports
├── site-visits/
│   ├── repository.ts         # SiteVisitsRepository
│   ├── types.ts             # SiteVisit-specific types
│   └── index.ts
├── flow-metrics/
│   ├── repository.ts         # FlowMetricsConfigRepository
│   ├── types.ts             # Metrics-specific types
│   └── index.ts
└── pipedrive/
    ├── repository.ts         # PipedriveDealFlowRepository + PipedriveMetricDataRepository
    ├── types.ts             # Pipedrive-specific types
    └── index.ts
```

**Tasks:**
1. Create feature directories under `lib/database/features/`
2. Move `SalesRequestsRepository` → `features/sales-requests/repository.ts`
3. Move `SiteVisitsRepository` → `features/site-visits/repository.ts`
4. Move `PipedriveSubmissionsRepository` → `features/sales-requests/repository.ts` (related to requests)
5. Extract feature-specific types into `types.ts` files
6. Create index files for clean imports

### Phase 3: Implement New Feature Repositories (4-6 hours)

#### 3.1 Create Flow Metrics Repository
**File:** `lib/database/features/flow-metrics/repository.ts`

**Class:** `FlowMetricsConfigRepository`
```typescript
export class FlowMetricsConfigRepository extends BaseRepositoryImpl<FlowMetricsConfig> {
  // Basic CRUD (inherited from base)
  create(data: NewFlowMetricsConfig): Promise<RepositoryResult<FlowMetricsConfig>>
  findById(id: string): Promise<RepositoryResult<FlowMetricsConfig | null>>
  update(id: string, data: Partial<NewFlowMetricsConfig>): Promise<RepositoryResult<FlowMetricsConfig | null>>
  delete(id: string): Promise<RepositoryResult<boolean>>
  
  // Custom methods
  findAll(includeInactive?: boolean): Promise<RepositoryResult<FlowMetricsConfig[]>>
  findActive(): Promise<RepositoryResult<FlowMetricsConfig[]>>
  findByMetricKey(metricKey: string): Promise<RepositoryResult<FlowMetricsConfig | null>>
  reorderMetrics(reorderData: Array<{id: string, sortOrder: number}>): Promise<RepositoryResult<boolean>>
  updateComment(id: string, comment: string): Promise<RepositoryResult<FlowMetricsConfig | null>>
}
```

**File:** `lib/database/features/flow-metrics/types.ts`
```typescript
export interface MetricConfigData {
  pipeline: { id: number; name: string };
  startStage: { id: number; name: string };
  endStage: { id: number; name: string };
  thresholds: { minDays: number; maxDays: number };
  comment?: string;
}

export interface DealMetricData {
  dealId: number;
  startDate: string;
  endDate: string;
  durationSeconds: number;
}
```

#### 3.2 Create Pipedrive Repositories
**File:** `lib/database/features/pipedrive/repository.ts`

**Classes:**
```typescript
export class PipedriveDealFlowRepository extends BaseRepositoryImpl<PipedriveDealFlowData> {
  // Bulk operations
  bulkInsert(flowDataArray: NewPipedriveDealFlowData[]): Promise<RepositoryResult<PipedriveDealFlowData[]>>
  bulkInsertWithConflictHandling(flowDataArray: NewPipedriveDealFlowData[]): Promise<RepositoryResult<PipedriveDealFlowData[]>>
  
  // Query methods
  findByDealId(dealId: number): Promise<RepositoryResult<PipedriveDealFlowData[]>>
  findAll(limit?: number): Promise<RepositoryResult<PipedriveDealFlowData[]>>
  
  // Metric calculations
  getDealsForMetric(metricKey: string, period?: string): Promise<RepositoryResult<DealMetricData[]>>
}

export class PipedriveMetricDataRepository extends BaseRepositoryImpl<PipedriveMetricData> {
  upsert(data: NewPipedriveMetricData): Promise<RepositoryResult<PipedriveMetricData>>
  findByDealId(dealId: number): Promise<RepositoryResult<PipedriveMetricData | null>>
}
```

### Phase 3: Create Legacy Adapters (1-2 hours)

Following the pattern in `lib/database/adapters/legacy-adapter.ts`, create adapters for new repositories:

#### 3.1 Flow Metrics Config Adapter
**File:** `lib/database/adapters/flow-metrics-config-adapter.ts`

Wraps `FlowMetricsConfigRepository` to maintain backward compatibility with existing `lib/db.ts` API:
- `getFlowMetricsConfig()` → `repository.findAll()`
- `getActiveFlowMetricsConfig()` → `repository.findActive()`
- `createFlowMetricConfig()` → `repository.create()`
- etc.

#### 3.2 Pipedrive Flow Data Adapter
**File:** `lib/database/adapters/pipedrive-flow-data-adapter.ts`

Wraps `PipedriveDealFlowRepository` and `PipedriveMetricDataRepository`:
- `insertDealFlowData()` → `repository.bulkInsertWithConflictHandling()`
- `getDealFlowData()` → `repository.findByDealId()` or `repository.findAll()`
- `getDealsForMetric()` → `repository.getDealsForMetric()`
- `insertDealMetadata()` → `metricDataRepository.upsert()`

### Phase 4: Update Import Paths (30 minutes)

Update imports in consuming files to use adapters:

```typescript
// Before
import { getActiveFlowMetricsConfig, getDealsForMetric } from '@/lib/db';

// After (temporary, using adapters)
import { getActiveFlowMetricsConfig, getDealsForMetric } from '@/lib/database/adapters/flow-metrics-config-adapter';

// Future (direct repository usage)
import { getRepository } from '@/lib/database/core/repository-factory';
const flowMetricsRepo = getRepository('flowMetricsConfig');
const result = await flowMetricsRepo.findActive();
```

### Phase 5: Update Repository Factory (15 minutes)

Extend `lib/database/core/repository-factory.ts` to include new repositories:

```typescript
export type RepositoryName = 
  | 'salesRequests' 
  | 'siteVisits' 
  | 'flowMetricsConfig'        // ← Add
  | 'pipedriveDealFlow'        // ← Add
  | 'pipedriveMetricData';     // ← Add

export function getRepository(name: RepositoryName): BaseRepository<any> {
  // Initialize new repositories...
  if (!repositories.flowMetricsConfig) {
    repositories.flowMetricsConfig = new FlowMetricsConfigRepository();
  }
  // etc.
}
```

### Phase 6: Testing & Validation (2-3 hours)

1. **Unit Tests:** Create test files for new repositories
   - `tests/unit/flow-metrics-config-repository.test.ts`
   - `tests/unit/pipedrive-deal-flow-repository.test.ts`

2. **Integration Tests:** Test adapter compatibility
   - Verify all API routes still work with adapters
   - Check that existing tests pass

3. **Manual Testing:**
   - Flow Metrics Report page (`/flow-metrics-report`)
   - Metric management UI
   - Pipedrive webhook processing
   - Deal flow data visualization

### Phase 7: Deprecate lib/db.ts (30 minutes)

Once all functions are migrated and tested:

1. Add deprecation notices to `lib/db.ts`:
```typescript
/**
 * @deprecated This file is being phased out.
 * Use repositories via getRepository('name') instead.
 * See: lib/database/repositories/
 */
```

2. Update documentation:
   - Mark `lib/db.ts` as legacy in `CLAUDE.md`
   - Add migration guide to `docs/`

3. Plan eventual removal (future PR):
   - Remove `lib/db.ts` entirely
   - Update all imports to use repositories directly
   - Remove legacy adapters

---

## Detailed Implementation Guide

### Example: Migrating getDealsForMetric

This is the most complex function requiring migration. Here's how to approach it:

#### Original Raw SQL (Lines 351-443):
```typescript
export const getDealsForMetric = async (metricKey: string, period?: string) => {
  // Get metric config
  const metricConfigResult = await sql`
    SELECT config FROM flow_metrics_config
    WHERE metric_key = ${metricKey} AND is_active = true LIMIT 1
  `;
  
  // Extract stage IDs
  const startStageId = config.startStage.id;
  const endStageId = config.endStage.id;
  
  // Complex CTE query
  const result = await sql`
    WITH deal_stages AS (
      SELECT deal_id, stage_id, entered_at,
        ROW_NUMBER() OVER (PARTITION BY deal_id, stage_id ORDER BY entered_at) as rn
      FROM pipedrive_deal_flow_data
      WHERE stage_id IN (${startStageId}, ${endStageId})
    ),
    start_stages AS (...),
    end_stages AS (...)
    SELECT s.deal_id, s.start_date, e.end_date,
      EXTRACT(EPOCH FROM (e.end_date - s.start_date))::BIGINT as duration_seconds
    FROM start_stages s JOIN end_stages e ON s.deal_id = e.deal_id
    WHERE e.end_date > s.start_date
    ORDER BY e.end_date DESC
  `;
  
  return result;
};
```

#### Drizzle ORM Migration:
```typescript
async getDealsForMetric(metricKey: string, period?: string): Promise<RepositoryResult<DealMetricData[]>> {
  try {
    // Step 1: Get metric config using FlowMetricsConfigRepository
    const configRepo = getRepository('flowMetricsConfig');
    const configResult = await configRepo.findByMetricKey(metricKey);
    
    if (configResult.isError() || !configResult.getData()) {
      return RepositoryResult.success([]);
    }
    
    const config = configResult.getData().config;
    const startStageId = config.startStage.id;
    const endStageId = config.endStage.id;
    
    // Step 2: Build CTEs using Drizzle
    // Option A: Use sql`` from drizzle-orm for complex CTEs
    import { sql as drizzleSql } from 'drizzle-orm';
    
    const dealStagesCTE = drizzleSql`
      SELECT deal_id, stage_id, entered_at,
        ROW_NUMBER() OVER (PARTITION BY deal_id, stage_id ORDER BY entered_at) as rn
      FROM ${pipedriveDealFlowData}
      WHERE ${pipedriveDealFlowData.stageId} IN (${startStageId}, ${endStageId})
    `.as('deal_stages');
    
    // Option B: Break into subqueries
    const startStages = await db
      .select({
        dealId: pipedriveDealFlowData.dealId,
        startDate: pipedriveDealFlowData.enteredAt
      })
      .from(pipedriveDealFlowData)
      .where(eq(pipedriveDealFlowData.stageId, startStageId))
      .groupBy(pipedriveDealFlowData.dealId);
    
    // ... continue building query
    
    return RepositoryResult.success(result);
  } catch (error) {
    return RepositoryResult.error(
      this.createError('Failed to get deals for metric', 'query_error', error)
    );
  }
}
```

**Note:** For very complex CTEs, Drizzle allows using `sql` from `drizzle-orm` which is type-safe and different from the raw Neon SQL. This maintains type safety while handling complex queries.

---

## Risk Assessment & Mitigation

### High Risk Areas

#### 1. **Complex CTE Query in getDealsForMetric**
- **Risk:** Drizzle may not support all PostgreSQL window functions elegantly
- **Mitigation:** 
  - Use Drizzle's `sql` template literal for CTEs (still type-safe)
  - Keep original query structure, just wrap in Drizzle constructs
  - Extensive testing with real data
  - Fallback: Keep this one function as raw SQL with comment explaining why

#### 2. **Bulk Insert with ON CONFLICT**
- **Risk:** `insertDealFlowData` handles duplicates via ON CONFLICT DO NOTHING
- **Mitigation:**
  - Drizzle supports `onConflictDoNothing()` method
  - Test thoroughly with duplicate data
  - Maintain transaction behavior

#### 3. **JSONB Column Operations**
- **Risk:** Config JSONB column has complex nested structure
- **Mitigation:**
  - Drizzle handles JSONB well with `.jsonb()` type
  - Use TypeScript types for JSONB structure validation
  - Test JSONB queries extensively

### Medium Risk Areas

#### 4. **Date Range Filtering**
- **Risk:** Period calculations ('7d', '14d', '1m', '3m') need accurate date arithmetic
- **Mitigation:**
  - Use JavaScript Date objects for calculations
  - Drizzle's `gte()` and `lte()` operators handle timestamps
  - Add unit tests for date range logic

#### 5. **API Route Compatibility**
- **Risk:** Changing imports could break existing API behavior
- **Mitigation:**
  - Use legacy adapters to maintain exact same function signatures
  - Comprehensive integration testing before deployment
  - Gradual rollout per API route

---

## Testing Strategy

### Unit Tests (Target: 90% coverage)

**File:** `tests/unit/flow-metrics-config-repository.test.ts`
```typescript
describe('FlowMetricsConfigRepository', () => {
  it('should create flow metric config with JSONB', async () => {
    const repo = getRepository('flowMetricsConfig');
    const config = {
      metricKey: 'test-metric',
      displayTitle: 'Test Metric',
      config: {
        startStage: { id: 1, name: 'Lead' },
        endStage: { id: 5, name: 'Won' },
        thresholds: { minDays: 7, maxDays: 30 }
      }
    };
    
    const result = await repo.create(config);
    
    expect(result.isSuccess()).toBe(true);
    expect(result.getData().config.startStage.id).toBe(1);
  });
  
  it('should find active metrics', async () => {
    // ... test implementation
  });
  
  it('should reorder metrics atomically', async () => {
    // ... test implementation
  });
});
```

**File:** `tests/unit/pipedrive-deal-flow-repository.test.ts`
```typescript
describe('PipedriveDealFlowRepository', () => {
  it('should bulk insert with conflict handling', async () => {
    // ... test duplicate handling
  });
  
  it('should calculate metric deals with CTEs', async () => {
    // ... test getDealsForMetric
  });
});
```

### Integration Tests

**File:** `tests/integration/flow-metrics-api.test.ts`
```typescript
describe('Flow Metrics API Integration', () => {
  it('GET /api/flow/metrics should return calculated metrics', async () => {
    // Test full API flow with repositories
  });
  
  it('POST /api/pipedrive-webhook should store flow data', async () => {
    // Test webhook → repository → database flow
  });
});
```

### Manual Testing Checklist

- [ ] Flow Metrics Report page loads correctly
- [ ] Metric KPI cards display accurate averages
- [ ] LeadTimeChart renders deal data
- [ ] Pipedrive webhook successfully stores flow data
- [ ] Metric management UI (create/update/delete/reorder) works
- [ ] Date range filtering (7d, 14d, 1m, 3m) returns correct data
- [ ] Performance: Query times remain < 500ms

---

## Timeline & Effort Estimate (Feature-Based Architecture)

| Phase | Estimated Time | Complexity |
|-------|---------------|------------|
| Phase 1: Infrastructure | 0h (✅ Done) | - |
| Phase 2: Reorganize to Features | 2-3h | Medium |
| Phase 3: Implement New Repositories | 4-6h | High |
| Phase 4: Create Adapters | 1-2h | Medium |
| Phase 5: Update Imports | 1h | Medium |
| Phase 6: Update Factory | 0.5h | Low |
| Phase 7: Testing | 2-3h | High |
| Phase 8: Deprecation | 0.5h | Low |
| **Total** | **11-17 hours** | - |

**Breakdown:**
- Reorganizing existing repos: 2-3h (moving files, updating imports)
- FlowMetricsConfigRepository: 2-3h 
- PipedriveDealFlowRepository: 2-3h (complex CTEs)
- PipedriveMetricDataRepository: 1h
- Testing all: 2-3h
- Documentation: 1h

---

## Success Criteria

### Functional Requirements
- ✅ All functions in `lib/db.ts` have Drizzle ORM equivalents
- ✅ All existing API routes work identically (backward compatibility)
- ✅ All existing tests pass without modification
- ✅ Manual testing checklist 100% complete

### Technical Requirements
- ✅ Zero raw SQL queries in `lib/db.ts` (except documented exceptions)
- ✅ All repositories follow `RepositoryResult<T>` pattern
- ✅ Type safety: No `any` types in repository methods
- ✅ Test coverage: ≥90% for new repositories

### Performance Requirements
- ✅ No performance degradation (query times within 10% of original)
- ✅ `getDealsForMetric` completes in < 500ms for typical datasets
- ✅ Bulk insert operations maintain similar throughput

### Documentation Requirements
- ✅ Repository method documentation with JSDoc
- ✅ Migration guide in `docs/`
- ✅ Update `CLAUDE.md` with new patterns
- ✅ Deprecation notices in `lib/db.ts`

---

## Future Enhancements (Post-Migration)

Once core migration is complete, consider:

1. **Direct Repository Usage in API Routes**
   - Gradually remove legacy adapters
   - Update API routes to use `getRepository()` directly
   - Cleaner code without translation layer

2. **Advanced Drizzle Features**
   - Prepared statements for frequently-used queries
   - Transactions for multi-step operations
   - Drizzle Studio for database exploration

3. **Performance Optimization**
   - Add database indexes based on query patterns
   - Implement query result caching for expensive operations
   - Consider read replicas for reporting queries

4. **Type Safety Improvements**
   - Stricter JSONB typing with Zod schemas
   - Runtime validation for all repository inputs
   - Better error types with discriminated unions

---

## Questions for Discussion

1. **CTE Complexity:** For `getDealsForMetric`, should we use Drizzle's `sql` template (type-safe) or keep it as raw SQL with a documented exception?

2. **Migration Approach:** Should we migrate all at once or do it incrementally per table group?

3. **Testing Priority:** Which API routes are most critical and should be tested first?

4. **Performance Baseline:** Should we establish performance benchmarks before migration to ensure no regression?

5. **Repository Naming:** Are the proposed repository names (`FlowMetricsConfigRepository`, `PipedriveDealFlowRepository`) clear and consistent with existing patterns?

---

## Appendix

### A. Reference Implementation: getActiveFlowMetricsConfig

The one function in `lib/db.ts` that already uses Drizzle (lines 457-494) serves as our reference:

```typescript
export const getActiveFlowMetricsConfig = async (): Promise<any[]> => {
  return withDbErrorHandling(async () => {
    const { db } = createStandardConnection();
    const result = await db
      .select()
      .from(flowMetricsConfig)
      .where(eq(flowMetricsConfig.isActive, true))
      .orderBy(asc(flowMetricsConfig.sortOrder), asc(flowMetricsConfig.displayTitle));

    // Convert camelCase to snake_case for backward compatibility
    const formattedResult = result.map((m: any) => ({
      id: m.id,
      metric_key: m.metricKey,
      display_title: m.displayTitle,
      config: m.config,
      sort_order: m.sortOrder,
      is_active: m.isActive,
      created_at: m.createdAt,
      updated_at: m.updatedAt
    }));

    return formattedResult;
  }, 'getActiveFlowMetricsConfig');
};
```

**Key Patterns to Follow:**
- Use `createStandardConnection()` to get db instance
- Use Drizzle query builders: `select()`, `from()`, `where()`, `orderBy()`
- Wrap in `withDbErrorHandling()` for consistent error handling
- Transform camelCase Drizzle results to snake_case for API compatibility

### B. Drizzle ON CONFLICT Example

```typescript
// Bulk insert with conflict handling
await db
  .insert(pipedriveDealFlowData)
  .values(flowDataArray)
  .onConflictDoNothing({ target: pipedriveDealFlowData.pipedriveEventId });
```

### C. Repository Factory Pattern

```typescript
// Usage in API routes
const flowMetricsRepo = getRepository('flowMetricsConfig');
const result = await flowMetricsRepo.findActive();

if (result.isError()) {
  return NextResponse.json({ error: result.getError().message }, { status: 500 });
}

const metrics = result.getData();
```

---

## Conclusion

This refactoring will bring significant benefits:

**Immediate Benefits:**
- ✅ Type safety: Catch errors at compile time
- ✅ Eliminate query truncation issues (Neon HTTP driver problems)
- ✅ Consistent error handling across all database operations
- ✅ Better IDE autocomplete and refactoring support

**Long-term Benefits:**
- ✅ Easier maintenance: Centralized database logic in repositories
- ✅ Testability: Mock repositories instead of raw SQL
- ✅ Scalability: Add new tables/operations following established patterns
- ✅ Team alignment: Single source of truth for database operations

**Project Alignment:**
- ✅ Follows CLAUDE.md directive: "ALWAYS USE DRIZZLE ORM - NEVER USE RAW SQL"
- ✅ Matches existing repository pattern for `requests` table
- ✅ Maintains backward compatibility during transition
- ✅ Enables eventual removal of legacy code

The estimated 7-11 hour investment will pay dividends through improved code quality, reduced bugs, and faster feature development.
