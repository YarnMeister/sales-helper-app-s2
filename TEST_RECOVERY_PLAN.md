# Test Suite Recovery Plan

## Current Situation
- **Test Files**: 30 files
- **Individual Tests**: ~301 test cases
- **Status**: Many tests failing due to mocking issues
- **Build**: ✅ Clean (no warnings)
- **Lint**: ✅ Clean (no errors)

## Phase 1: Immediate Test Stabilization (Priority 1)

### 1.1 Fix Core Mocking Issues
- [x] Fix `createMockFetch` to handle unexpected API calls gracefully
- [x] Update test setup to prevent `mockClear` errors
- [ ] Fix React `act()` warnings in remaining tests
- [ ] Stabilize test timeouts and async handling

### 1.2 Focus on Critical Test Files
Priority order for fixing:
1. `flow-metrics-period-selection.test.tsx` - Core UI functionality
2. `flow-metrics-ui.test.tsx` - Main metrics display
3. `flow-metrics-api.test.ts` - API endpoints
4. `pipedrive-flow-data.test.ts` - Data integration

### 1.3 Target: Get 80%+ tests passing
- Current: ~120 failed / 198 total
- Target: <40 failed tests
- Timeline: 2-3 hours

## Phase 2: Test Suite Optimization (Priority 2)

### 2.1 Performance Improvements
- [ ] Optimize test execution time
- [ ] Reduce memory usage
- [ ] Improve test isolation

### 2.2 Coverage Analysis
- [ ] Identify missing test coverage
- [ ] Add critical missing tests
- [ ] Ensure core functionality is tested

### 2.3 Target: 90%+ test pass rate
- Timeline: 1-2 hours

## Phase 3: Production Readiness (Priority 3)

### 3.1 Final Validation
- [ ] All tests passing
- [ ] No React warnings
- [ ] Fast execution (<30 seconds)
- [ ] Reliable CI/CD integration

### 3.2 Deployment Preparation
- [ ] Create feature branch for test fixes
- [ ] Deploy to staging for validation
- [ ] Ready for architecture modularization

## Success Metrics
- **Test Pass Rate**: >90%
- **Execution Time**: <30 seconds
- **No React Warnings**: ✅
- **Build Status**: ✅ Clean
- **Ready for Architecture Work**: ✅

## Next Steps
1. Complete Phase 1 fixes
2. Run full test suite
3. Deploy test fixes branch
4. Begin architecture modularization
