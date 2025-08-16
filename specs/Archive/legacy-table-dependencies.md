# Legacy Table Dependencies Analysis

## Overview
This document tracks all code references to legacy tables that need to be updated during the rewrite.

## Legacy Tables to be Dropped
- `quote_requests` - Main quote data (replaced by `requests`)
- `line_items` - Line item data (embedded in `requests.line_items` JSONB)
- `contacts` - Contact data (embedded in `requests.contact` JSONB)
- `mock_pipedrive_submissions` - Old mock table (replaced by new schema)

## File Dependencies Analysis

### High Priority - Core API Routes

#### `/app/api/quotes/route.ts`
- **Current**: Uses `quote_requests` table
- **Impact**: Complete rewrite needed
- **New Pattern**: Use `requests` table with JSONB queries

#### `/app/api/create-pipedrive-deal/route.ts`
- **Current**: Uses `quote_requests` and `contacts` tables
- **Impact**: Major rewrite needed
- **New Pattern**: Use `requests` table, mock submissions to new table

#### `/app/api/add-pipedrive-note/route.ts`
- **Current**: Uses `mock_pipedrive_submissions` table
- **Impact**: Update to new table schema
- **New Pattern**: Use new `mock_pipedrive_submissions` table

### Medium Priority - Database Layer

#### `/lib/database.ts`
- **Current**: Multiple functions using `quote_requests`
- **Impact**: Complete rewrite needed
- **New Pattern**: New database utility functions for JSONB queries

#### `/lib/pipedrive/mockSubmit.ts`
- **Current**: Uses old `mock_pipedrive_submissions` schema
- **Impact**: Update to new simplified schema
- **New Pattern**: Use new table structure

### Low Priority - Utilities and Tests

#### `/tests/utils/supabaseTestClient.ts`
- **Current**: Uses `quote_requests` and `mock_pipedrive_submissions`
- **Impact**: Update test utilities
- **New Pattern**: New test data creation functions

#### `/tests/api/` files
- **Current**: Various test files using legacy tables
- **Impact**: Rewrite tests for new schema
- **New Pattern**: Test new JSONB-based operations

## Migration Strategy

### Phase 1: Database Schema (Current)
- [x] Create new tables and functions
- [ ] Apply migrations to test environment
- [ ] Validate schema works correctly

### Phase 2: Core API Routes
- [ ] Update `/app/api/quotes/route.ts`
- [ ] Update `/app/api/create-pipedrive-deal/route.ts`
- [ ] Update `/app/api/add-pipedrive-note/route.ts`

### Phase 3: Database Layer
- [ ] Rewrite `/lib/database.ts`
- [ ] Update `/lib/pipedrive/mockSubmit.ts`

### Phase 4: Testing Infrastructure
- [ ] Update `/tests/utils/supabaseTestClient.ts`
- [ ] Rewrite all test files

### Phase 5: Legacy Cleanup
- [ ] Drop legacy tables
- [ ] Remove legacy code references
- [ ] Update documentation

## Breaking Changes Summary

### Immediate Impact (After Migration)
- All API routes will return errors
- All database queries will fail
- All tests will fail
- Build process may fail

### Expected Duration
- **Phase 1**: 1-2 hours (database setup)
- **Phase 2**: 2-4 hours (core API updates)
- **Phase 3**: 1-2 hours (database layer)
- **Phase 4**: 2-3 hours (testing updates)
- **Phase 5**: 1 hour (cleanup)

**Total Expected Downtime**: 7-12 hours

## Risk Mitigation

### Before Migration
- [ ] Complete backup of test environment
- [ ] Document current working state
- [ ] Prepare rollback plan

### During Migration
- [ ] Work in feature branch
- [ ] Test each phase thoroughly
- [ ] Keep legacy code available for reference

### After Migration
- [ ] Comprehensive testing
- [ ] Performance validation
- [ ] Documentation updates
