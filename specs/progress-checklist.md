# Sales Helper App Rewrite - Complete Implementation Checklist

## Overview
This checklist covers the complete rewrite of the Sales Helper App from a complex relational schema to an optimized flat JSONB architecture. Each section contains multiple implementation prompts that should be executed in order.


## Section 1: Environment Setup & Foundation

### 1.1 Environment Configuration
- [x] Create comprehensive environment configuration system
  - [x] Create `.env.example` with all required variables
  - [x] Create `/lib/env.ts` with complete environment validation
  - [x] Install required dependencies: `zod @supabase/supabase-js dotenv`
  - [x] Create `/scripts/env-check.js` for environment validation
  - [x] Make env-check script executable: `chmod +x scripts/env-check.js`
  - [x] Manual validation: Run `npm run env:check` and verify success
  - [x] Test with missing env vars to ensure proper error messages
  - [x] Verify APP_ENV=test vs APP_ENV=prod selects different DB credentials
  Skipped till later:
 - [ ] Install dev dependencies: `vitest @playwright/test @types/node`
  
  De-scoped due to green approach
  - [ ] Update `package.json` scripts section (not needed for new build)

### 1.2 Database Foundation & Schema

- [x] Create database schema migrations for flat JSONB structure
  - [x] Create `/supabase/migrations/20250815000001_requests_flat_schema.sql`
  - [x] Create `/supabase/migrations/20250815000002_support_tables.sql`

  Skipped
  - [x] Check all tables exist: requests, kv_cache (Redis), mock_pipedrive_submissions
  - [x] Verify all indexes created correctly, including salesperson index
  - [x] Test generated columns with sample JSONB data
  - [x] Confirm trigger updates updated_at on row updates
  - [x] Test automatic request ID generation via trigger
  - [x] Verify contact JSONB validation function
  - [x] Test salesperson_selection constraint with valid/invalid values
  - [ ] Add Upstash "QStash/Workflow" for background processing Pipedrive deals/retries (maybe)

  De-scoped due to green approach
 - [ ] Apply migrations to both test and prod databases (manual)
 - [ ] Manual validation: Run `supabase migration up` with no errors

## Section 1.3 Convert to Neon (Postgres) and Upstash Redis (contacts/products KV)

### Updated Environment Configuration

- [x] **Update environment configuration for Neon + Upstash**
  - [x] Update `/lib/env.ts` with new simplified schema (7 variables)
  - [x] Update `.env.example` with new structure
  - [x] Update `/scripts/env-check.js` for new environment variables
  - [x] Install new dependencies: `npm install pg @types/pg @upstash/redis`
  - [x] Remove Supabase dependency: `npm uninstall @supabase/supabase-js`
  - [x] Manual validation: Run `npm run env:check` with new variables
  - [x] Test URL masking in env-check script
  - [x] Verify DATABASE_URL and REDIS_URL validation works



#### Cache Key Management

- [ ] **Update cache key strategy for Redis**
  - [x] Define cache key constants in `/lib/cache.ts`
  - [x] Verify cache busting works with patterns
  
  Skipped
  - [ ] Implement cache warming for critical data
  - [ ] Add cache versioning for schema changes
  - [ ] Test cache key naming conventions
  - [ ] Manual validation: Cache keys are properly namespaced

---

## Section 2: Core Schema & Validation

### 2.1 Schema Contracts & Validation
- [ ] Create comprehensive schema validation system
  - [ ] Create `/lib/log.ts` for structured logging
  - [ ] Create `/lib/errors.ts` for standardized error handling
  - [ ] Create `/lib/schema.ts` with comprehensive Zod schemas
  - [ ] Create unit tests in `/tests/unit/schema.test.ts`
  - [ ] Manual validation: Import schemas and verify TypeScript types
  - [ ] Test Zod validation with valid/invalid data samples
  - [ ] Verify error classes extend properly with correct status codes
  - [ ] Test errorToResponse returns proper JSON format
  - [ ] Test mobile-first ContactJSON requirements (mineGroup, mineName)
  - [ ] Verify SalespersonSelection enum validation
  - [ ] Test RequestUpsert validation for mobile-first salesperson requirements

### 2.2 Database Client & Utilities
- [ ] Create environment-aware database client
  - [ ] Create `/lib/db.ts` with database utilities
  - [ ] Update unit tests in `/tests/unit/db.test.ts`
  - [ ] Create integration test in `/tests/integration/db-integration.test.ts`
  - [ ] Manual validation: Test database client with correct environment
  - [ ] Test generateRequestId creates sequential IDs using database function
  - [ ] Test validateContactJsonb using database function
  - [ ] Test database health check functionality
  - [ ] Test withDbErrorHandling for proper error management
  - [ ] Test KV cache set/get functionality
  - [ ] Test salesperson constraint in database with valid/invalid values

---

## Section 3: API Layer Implementation

### 3.1 Core Request Management API
- [ ] Implement CRUD operations with PRD-specific filtering
  - [ ] Create `/app/api/requests/route.ts`
  - [ ] Create unit tests in `/tests/unit/requests-api.test.ts`
  - [ ] Manual validation: Test GET /api/requests returns proper JSON
  - [ ] Test GET with salesperson filter (Luyanda, James, Stefan)
  - [ ] Test showAll parameter controls filtering and New Request button visibility
  - [ ] Test POST creates new request with generated QR-xxx ID
  - [ ] Test POST supports inline updates for existing requests
  - [ ] Test DELETE removes request successfully
  - [ ] Verify all database queries use proper indexes (generated columns)

### 3.2 Submit & Pipedrive Integration API
- [ ] Implement submission logic with mock/real mode support
  - [ ] Create `/lib/pipedrive.ts` for Pipedrive integration
  - [ ] Create `/app/api/submit/route.ts`
  - [ ] Manual validation: Test mock submission creates entry in mock_pipedrive_submissions
  - [ ] Test mock submission updates request status to 'submitted'
  - [ ] Test validation errors for requests without contact or line items
  - [ ] Test submission fails gracefully with invalid request ID
  - [ ] Test environment variable PIPEDRIVE_SUBMIT_MODE switches behavior
  - [ ] Verify Pipedrive API timeout handling

### 3.3 Contacts & Products API with Caching
- [ ] Implement data fetching APIs with intelligent caching
  - [ ] Create `/lib/cache.ts` for caching system
  - [ ] Create `/app/api/contacts/route.ts`
  - [ ] Create `/app/api/products/route.ts`
  - [ ] Create `/app/api/cache/route.ts`
  - [ ] Manual validation: Test contacts API returns PRD hierarchical data
  - [ ] Test products API returns categorized data
  - [ ] Test cache fallback when Pipedrive unavailable
  - [ ] Test cache busting via POST /api/cache
  - [ ] Verify cache age calculation and stale detection
  - [ ] Test offline tolerance with stale cache

### 3.4 Health Monitoring & System Status APIs
- [ ] Implement comprehensive health monitoring
  - [ ] Create `/app/api/health/route.ts`
  - [ ] Create `/app/api/health/detailed/route.ts`
  - [ ] Manual validation: Test basic health endpoint returns environment info
  - [ ] Test detailed health endpoint shows database connectivity
  - [ ] Test health endpoint returns 503 when database down
  - [ ] Verify cache status properly reported
  - [ ] Test submission rate calculation accuracy

### 3.5 Production Configuration & Security
- [ ] Implement production-ready configuration
  - [ ] Create production configuration in `/next.config.js`
  - [ ] Manual validation: Test security headers applied to all routes
  - [ ] Test compression enabled in production
  - [ ] Test old route redirects work correctly
  - [ ] Verify environment variables properly exposed
  - [ ] Test ETags generated for static content
  - [ ] Verify X-Powered-By header removed

### 3.6 Pre-Deployment Automation & Validation
- [ ] Implement automated pre-deployment checks
  - [ ] Create `/scripts/pre-deploy-check.js`
  - [ ] Manual validation: Test environment variable validation catches missing vars
  - [ ] Test database migration status check
  - [ ] Test unit and integration test validation
  - [ ] Test build process validation
  - [ ] Test API health check during startup
  - [ ] Test security audit catches vulnerabilities
  - [ ] Verify script exits with proper codes (0=success, 1=failure)

### 3.7 Deployment Documentation & Configuration
- [ ] Create complete deployment documentation
  - [ ] Create `/docs/DEPLOYMENT.md`
  - [ ] Manual validation: Test deployment guide with fresh environment
  - [ ] Verify all environment variables documented
  - [ ] Test health check endpoints work as documented
  - [ ] Validate troubleshooting steps resolve common issues
  - [ ] Confirm post-deployment verification checklist complete

---

## Section 4: Testing Infrastructure

### 4.1 Unit Test Framework
- [ ] Establish comprehensive unit testing
  - [ ] Create `/tests/_utils/test-data.ts`
  - [ ] Create `/tests/_utils/db-cleanup.ts`
  - [ ] Create `/tests/unit/schema.test.ts`
  - [ ] Create `/tests/unit/cache.test.ts`
  - [ ] Create `/tests/unit/db.test.ts`
  - [ ] Update `/vitest.config.ts`
  - [ ] Create `/tests/setup.ts`
  - [ ] Manual validation: Run `npm run test:unit` and verify all tests pass
  - [ ] Check test data properly isolated (no conflicts between tests)
  - [ ] Verify test cleanup removes old data without affecting other tests

### 4.2 Integration Testing
- [ ] Test API endpoints with real database interactions
  - [ ] Create `/tests/_utils/test-server.ts`
  - [ ] Create `/tests/integration/requests-api.integration.test.ts`
  - [ ] Create `/tests/integration/prd-requirements.integration.test.ts`
  - [ ] Create `/tests/integration/submit-api.integration.test.ts`
  - [ ] Create `/tests/integration/cache-api.integration.test.ts`
  - [ ] Manual validation: Run `npm run test:integration` and verify all tests pass
  - [ ] Test PRD-specific requirements: showAll parameter, submit button logic
  - [ ] Test cache behavior: first call fetches, second serves from cache
  - [ ] Test offline tolerance and stale cache behavior

### 4.3 End-to-End Testing
- [ ] Create comprehensive E2E test for complete submission workflow
  - [ ] Create `/playwright.config.ts`
  - [ ] Create `/tests/e2e/pages/main-page.ts`
  - [ ] Create `/tests/e2e/specs/submit-workflow.e2e.spec.ts`
  - [ ] Create `/tests/e2e/specs/prd-requirements.e2e.spec.ts`
  - [ ] Create `/tests/e2e/specs/navigation.e2e.spec.ts`
  - [ ] Create `/tests/e2e/specs/offline-behavior.e2e.spec.ts`
  - [ ] Update package.json scripts
  - [ ] Create `/tests/_utils/api.ts`
  - [ ] Create `/tests/e2e/helpers/mock-data.ts`
  - [ ] Manual validation: Run `npx playwright install` to install browsers
  - [ ] Run `npm run test:e2e` and verify all E2E tests pass
  - [ ] Test complete submission workflow in browser automation
  - [ ] Verify offline handling works correctly

---

## Section 6: UI Updates & Integration

### 6.1 Main Page Redesign with Flat Schema Integration
- [ ] Implement streamlined UI leveraging flat JSONB schema
  - [ ] Create `/app/components/RequestCard.tsx`
  - [ ] Update `/app/page.tsx` to use new flat schema API
  - [ ] Manual validation: Test main page loads with optimized database queries
  - [ ] Verify filtering uses generated columns for performance
  - [ ] Test PRD-compliant inline editing for contacts and line items
  - [ ] Verify inline comment editing with auto-save on blur
  - [ ] Test submission workflow with proper status updates
  - [ ] Check statistics calculations are accurate
  - [ ] Test New Request button only shows when specific salesperson selected

### 6.2 Contact and Product Selection with Caching Integration
- [ ] Implement efficient UI components leveraging caching API
  - [ ] Create `/app/components/ContactSelector.tsx`
  - [ ] Create `/app/components/ProductSelector.tsx`
  - [ ] Update `/app/add-contact/page.tsx`
  - [ ] Update `/app/add-line-items/page.tsx`
  - [ ] Manual validation: Test contact selector loads hierarchical data from cache
  - [ ] Test product selector loads categorized data from cache
  - [ ] Verify offline mode displays stale data warning
  - [ ] Test search functionality works efficiently
  - [ ] Test quantity controls work properly for products
  - [ ] Verify navigation flow preserves request editing state

### 6.3 Performance Optimization & Testing Integration
- [ ] Implement performance optimizations and comprehensive testing
  - [ ] Create `/app/components/RequestCardOptimized.tsx`
  - [ ] Create `/app/types/index.ts`
  - [ ] Create `/app/hooks/useSessionStorage.ts`
  - [ ] Create `/app/hooks/useApi.ts`
  - [ ] Create `/app/components/ErrorBoundary.tsx`
  - [ ] Create `/app/utils/performance.ts`
  - [ ] Create `/__tests__/components/RequestCard.test.tsx`
  - [ ] Create `/__tests__/hooks/useApi.test.tsx`
  - [ ] Create `/__tests__/components/ContactSelector.test.tsx`
  - [ ] Create `/__tests__/utils/performance.test.tsx`
  - [ ] Create `/__tests__/integration/mainPage.test.tsx`
  - [ ] Manual validation: Test RequestCardOptimized renders without unnecessary re-renders
  - [ ] Verify memoized components prevent performance issues
  - [ ] Test error boundary catches and displays errors gracefully
  - [ ] Run unit tests and verify all pass with `npm test`

---

## Section 7: Final Integration & Testing

### 7.1 Complete System Integration
- [ ] Ensure all components work together seamlessly
  - [ ] Create `/app/layout.tsx` updates for navigation
  - [ ] Create `/components/Navigation.tsx`
  - [ ] Create `/tests/integration/full-system.integration.test.ts`
  - [ ] Create `/tests/integration/performance.integration.test.ts`
  - [ ] Manual validation: Run `npm run test:integration` and verify all tests pass
  - [ ] Test complete workflow: create → add contact → add line items → comment → submit
  - [ ] Verify generated column indexing shows performance improvements
  - [ ] Test JSONB containment queries with GIN indexing
  - [ ] Test concurrent operations don't cause data corruption

### 7.2 Production Deployment Checklist
- [ ] Ensure system ready for production deployment
  - [ ] Create `/scripts/pre-deploy-check.js`
  - [ ] Create `/scripts/post-deploy-monitor.js`
  - [ ] Create `/app/api/health/route.ts`
  - [ ] Create `/app/api/health/detailed/route.ts`
  - [ ] Create `/scripts/production-validation.js`
  - [ ] Manual validation: Run `npm run pre-deploy` and verify all checks pass
  - [ ] Execute health check endpoints and confirm all systems green
  - [ ] Test database migrations on staging environment first
  - [ ] Verify Pipedrive API connectivity and authentication
  - [ ] Check performance benchmarks meet expectations (<500ms queries)

### 7.3 Post-Deployment Verification
- [ ] Validate production deployment and establish monitoring
  - [ ] Create `/scripts/post-deployment-verification.js`
  - [ ] Create `/scripts/monitoring-dashboard.js`
  - [ ] Create `/scripts/prd-monitoring-report.js`
  - [ ] Create `/app/api/health/prd/route.ts`
  - [ ] Update package.json with monitoring scripts
  - [ ] Manual validation: Run `npm run post-deploy:verify` and ensure all workflows complete
  - [ ] Test complete user journey from creation to submission
  - [ ] Verify real Pipedrive data integration works correctly
  - [ ] Confirm performance meets expectations under concurrent load
  - [ ] Monitor system for 24 hours post-deployment

### 7.4 Documentation & Handover
- [ ] Create comprehensive documentation for the rewritten system
  - [ ] Create `/docs/ARCHITECTURE.md`
  - [ ] Create `/docs/DEPLOYMENT.md`
  - [ ] Create `/docs/API.md`
  - [ ] Create `/docs/MAINTENANCE.md`
  - [ ] Manual validation: All documentation files created and accessible
  - [ ] Architecture documentation accurately reflects current system design
  - [ ] Deployment guide includes all necessary steps
  - [ ] API documentation matches actual endpoint behavior
  - [ ] Maintenance guide provides actionable troubleshooting steps

---

## Final Validation Checklist

### System Architecture Validation
- [ ] ✅ All integration tests pass with new JSONB schema
- [ ] ✅ Navigation and UI components work seamlessly
- [ ] ✅ Performance improvements validated (80%+ query speed increase)
- [ ] ✅ Generated columns and indexing strategy proven effective
- [ ] ✅ Caching layer functions correctly with 24h TTL
- [ ] ✅ Mock Pipedrive integration enables safe development

### Production Readiness
- [ ] ✅ All tests passing (unit, integration, e2e)
- [ ] ✅ Pre-deployment checks validated
- [ ] ✅ Database migrations tested and applied
- [ ] ✅ Post-deployment verification confirms functionality
- [ ] ✅ Monitoring dashboard operational
- [ ] ✅ Health check endpoints responding
- [ ] ✅ Performance benchmarks met
- [ ] ✅ Error handling validates properly
- [ ] ✅ Cache performance optimized
- [ ] ✅ Documentation complete and accurate


---



---
