# Flow Metrics Test Improvement Plan

## Current Status

### ✅ Fixed Issues
1. **Infinite Loop in MetricsManagement**: Fixed `useEffect` dependency array issue
2. **Test Timeout Implementation**: Added 3-minute timeout protection
3. **Unit Tests**: All 20 unit tests now passing
4. **Test Utilities**: Created reusable test utilities and mock data

### ❌ Remaining Issues
1. **Integration Tests**: 8 failing tests in `flow-metrics-integration.test.tsx`
2. **Test Data Mismatches**: Some tests expect different text/button names
3. **API Mocking**: Need better API response mocking for integration tests

## Test Files Status

### ✅ Working Tests
- `tests/unit/flow-metrics-ui.test.tsx` - **20/20 passing**
  - ViewToggle component tests
  - DealInputForm component tests  
  - FlowDataTable component tests
  - MetricsManagement component tests (including cornerstone test)

### ❌ Failing Tests
- `tests/integration/flow-metrics-integration.test.tsx` - **2/10 passing**
  - Flow Metrics Report Page tests
  - Flow Metric Detail Page tests
  - End-to-End Flow tests

## Cornerstone Test: Manufacturing Lead Time

### Test Data
```typescript
MANUFACTURING_LEAD_TIME_METRIC = {
  id: '1',
  metric_key: 'manufacturing-lead-time',
  display_title: 'Manufacturing Lead Time',
  canonical_stage: 'MANUFACTURING',
  start_stage_id: 5, // Quality Control
  end_stage_id: 8,   // Order Inv Paid
  // ...
}
```

### Test Coverage
- ✅ Edit button functionality
- ✅ Stage ID mapping (5 → 8)
- ✅ Save functionality
- ✅ Data persistence
- ✅ UI state management

## Integration Test Issues

### 1. Text Mismatches
- Expected: "Canonical Stage Mappings" → Actual: "Flow Metrics Management"
- Expected: "Back" button → Actual: No accessible name

### 2. API Response Issues
- Missing mock data for canonical stage deals
- Incorrect API endpoint mocking

### 3. Component State Issues
- Loading states not properly handled
- Async operations not properly awaited

## Improvement Actions

### Phase 1: Fix Integration Tests ✅
- [x] Fix infinite loops in MetricsManagement
- [x] Add timeout protection
- [x] Create test utilities
- [x] Fix unit tests

### Phase 2: Fix Integration Tests (Next)
- [ ] Update test expectations to match actual UI
- [ ] Improve API mocking
- [ ] Fix async test handling
- [ ] Add proper error handling tests

### Phase 3: Add Missing Tests
- [ ] Add tests for all 3 tabs (Metrics, Raw Data, Mappings)
- [ ] Add tests for Edit button across all metrics
- [ ] Add tests for data validation
- [ ] Add tests for error scenarios

### Phase 4: Performance & Reliability
- [ ] Add test performance monitoring
- [ ] Implement test retry logic
- [ ] Add test coverage reporting
- [ ] Create test documentation

## Test Utilities Created

### `tests/test-utils.ts`
- `TEST_TIMEOUT`: 3-minute timeout constant
- `createMockFetch()`: Centralized fetch mocking
- `mockUseToast()`: Stable toast mock
- `MANUFACTURING_LEAD_TIME_METRIC`: Cornerstone test data
- `MANUFACTURING_FLOW_DATA`: Flow data for testing
- `setupFlowMetricsTest()`: Test setup function
- `cleanupFlowMetricsTest()`: Test cleanup function

### `scripts/test-with-timeout.sh`
- Timeout protection for all tests
- Proper error handling
- Clear success/failure reporting

## Next Steps

1. **Fix Integration Tests**: Update expectations and API mocking
2. **Add Missing Coverage**: Ensure all 3 tabs are tested
3. **Improve Reliability**: Add retry logic and better error handling
4. **Documentation**: Create comprehensive test documentation

## Success Criteria

- [ ] All unit tests passing (✅ Done)
- [ ] All integration tests passing
- [ ] 3-minute timeout protection working
- [ ] Cornerstone test (Manufacturing Lead Time) working
- [ ] All 3 tabs tested
- [ ] Edit button functionality tested across all metrics
- [ ] No infinite loops or hanging tests
