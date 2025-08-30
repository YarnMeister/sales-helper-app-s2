# Sales Helper App - Testing Playbook

## Core Testing Principles

### 1. Mock Ownership Hierarchy (CRITICAL)

**NEVER OVERRIDE INFRASTRUCTURE MOCKS IN FEATURE TESTS**

```
Level 1: Infrastructure (tests/setup.ts) - IMMUTABLE
├── Database connections (db.ts)
├── Redis connections (cache.ts)
├── Environment variables (NODE_ENV, DATABASE_URL)
├── Next.js router core (useRouter, useSearchParams)
└── Global fetch interceptor setup

Level 2: Feature Behavior (features/x/__tests__/test-utils.ts) - CONFIGURABLE  
├── API response data
├── Feature-specific hooks
├── Component props
└── Local state

Level 3: Test-Specific (individual test files) - MINIMAL
└── Component props only
```

**Rule**: Feature tests must use Level 2 utilities, never override Level 1.

### 2. Strict Test Isolation Protocol

Every test file MUST include this exact pattern:

```typescript
// At file top - REQUIRED
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual,
    useRouter: vi.fn(() => mockUseRouter),
    useSearchParams: vi.fn(() => new URLSearchParams())
  };
});

// In describe block - REQUIRED
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});
```

## Feature Module Test Architecture

### Directory Structure (POST-RESTRUCTURE)

```
app/features/sales-requests/
├── __tests__/
│   ├── test-utils.ts          # Feature-specific mocks & helpers
│   ├── factories.ts           # Request/Contact/LineItem builders
│   ├── RequestForm.test.tsx   # Component tests
│   ├── api.test.ts           # API route tests
│   └── integration.test.ts    # Feature integration tests
├── components/
├── api/
├── hooks/
└── utils/

tests/ # Global infrastructure only
├── setup.ts                   # Global mocks (DO NOT MODIFY)
├── shared-utils.ts           # Cross-feature test utilities
└── integration/              # Cross-feature integration tests
```

### Feature Test Utils Pattern

Each feature MUST have its own test-utils.ts:

```typescript
// app/features/sales-requests/__tests__/test-utils.ts

// Mock API responses - NOT the fetch mechanism
export const mockApiResponses = {
  contacts: () => [...],
  products: () => [...],
  submitRequest: (data: any) => ({ ok: true, id: 'QR-123' })
};

// Feature-specific render helpers
export const renderRequestForm = (props = {}) => {
  return render(<RequestForm {...props} />, {
    wrapper: ({ children }) => (
      <RequestProvider>
        {children}  
      </RequestProvider>
    )
  });
};

// NO router mocking here - use global setup
// NO fetch mocking here - configure responses only
```

## Test Type Definitions

### 1. Unit Tests (features/x/__tests__/*.test.ts)

**Scope**: Pure functions, utilities, validators
**Location**: Within feature modules
**Dependencies**: None (no external APIs, no database)

```typescript
// Example: features/sales-requests/__tests__/validation.test.ts
describe('validateRequestData', () => {
  it('validates required fields', () => {
    const result = validateRequestData({});
    expect(result.errors).toContain('salesperson required');
  });
});
```

### 2. Component Tests (features/x/__tests__/*.test.tsx)

**Scope**: UI behavior, form interactions, rendering
**Location**: Within feature modules  
**Dependencies**: Mocked APIs via test-utils

```typescript
// Example: features/sales-requests/__tests__/RequestForm.test.tsx
describe('RequestForm', () => {
  it('submits valid request data', async () => {
    const onSubmit = vi.fn();
    renderRequestForm({ onSubmit });
    
    await userEvent.type(screen.getByLabelText(/salesperson/i), 'Luyanda');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ salesperson: 'Luyanda' })
      );
    });
  });
});
```

### 3. API Tests (features/x/__tests__/api.test.ts)

**Scope**: Route handlers, request/response validation
**Location**: Within feature modules
**Dependencies**: Database (test database), real validation logic

```typescript
// Example: features/sales-requests/__tests__/api.test.ts
describe('POST /api/v1/sales-requests', () => {
  it('creates request with valid data', async () => {
    const requestData = buildRequest();
    const response = await POST({ json: () => requestData });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });
});
```

### 4. Feature Integration Tests (features/x/__tests__/integration.test.ts)

**Scope**: Complete workflows within a single feature
**Location**: Within feature modules
**Dependencies**: Database, cache, external APIs (mocked)

```typescript
// Example: features/sales-requests/__tests__/integration.test.ts
describe('Sales Request Workflow', () => {
  it('completes full request creation to submission flow', async () => {
    // Mock external APIs
    vi.mocked(fetch).mockImplementation(mockPipedriveAPI);
    
    // Create request
    const request = await createRequest(buildRequest());
    
    // Submit to Pipedrive  
    const result = await submitRequest(request.id);
    
    expect(result.pipedriveId).toBeDefined();
  });
});
```

### 5. Cross-Feature Integration Tests (tests/integration/)

**Scope**: Feature communication, shared services
**Location**: Global tests directory
**Dependencies**: Multiple features, database, cache, external APIs

```typescript
// Example: tests/integration/auth-flow.test.ts
describe('Authentication Flow', () => {
  it('protects all feature API routes', async () => {
    // Test that all feature APIs require authentication
    const routes = ['/api/v1/sales-requests', '/api/v1/flow-metrics'];
    
    for (const route of routes) {
      const response = await fetch(route);
      expect(response.status).toBe(401);
    }
  });
});
```

## Critical Anti-Patterns to Avoid

### NEVER DO THIS:

```typescript
// ❌ Overriding global router mock in component test
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }) // Incomplete mock
}));

// ❌ Mocking fetch directly in component tests  
vi.mock('global', () => ({
  fetch: vi.fn()
}));

// ❌ Mixing component and API testing
describe('RequestForm', () => {
  it('submits to API and handles response', () => {
    // Testing component + API together
  });
});
```

### ALWAYS DO THIS:

```typescript
// ✅ Use global router mock, configure behavior via test-utils
const { renderRequestForm } = require('./test-utils');

// ✅ Mock API responses, not fetch mechanism
beforeEach(() => {
  mockApiResponses.contacts.mockReturnValue([...]);
});

// ✅ Separate component and API concerns
describe('RequestForm UI', () => {
  it('renders form fields correctly', () => {
    // UI testing only
  });
});

describe('Request API', () => {
  it('validates request data', () => {
    // API testing only  
  });
});
```

## Migration Strategy for Existing Tests

### Phase 1: Fix Current Failures (Before Restructure)

1. **Audit failing tests** - Identify router/fetch mock overrides
2. **Create temporary feature test-utils** - Move API mocking logic
3. **Remove global mock overrides** - Use configuration instead
4. **Validate test isolation** - Ensure afterEach cleanup works

### Phase 2: Feature Extraction (During Restructure)

1. **Move tests with components** - Keep tests colocated
2. **Create feature test-utils** - Isolated mock configuration
3. **Update imports** - Adjust for new directory structure  
4. **Add integration tests** - Test feature boundaries

### Phase 3: Enhanced Testing (Post-Restructure)

1. **Cross-feature integration tests** - Test module communication
2. **Authentication integration** - Test protected routes
3. **Database migration tests** - Validate schema changes
4. **Performance regression tests** - Monitor feature impact

## Enforcement and Validation

### Pre-commit Hooks

```bash
# Required checks before commit
npm run test:validate-structure  # Check test organization
npm run test:validate-mocks     # Check mock usage patterns  
npm run test:coverage           # Ensure coverage thresholds
npm run test:isolation          # Validate test isolation
```

### CI/CD Pipeline

```yaml
# Required CI stages
test-unit:          # Fast unit tests first
test-component:     # Component tests in parallel  
test-integration:   # Integration tests after unit
test-e2e:          # Full workflow tests last
```

### Coverage Requirements

- **Unit Tests**: ≥90% coverage within feature
- **Component Tests**: ≥85% coverage for UI components
- **Integration Tests**: ≥75% coverage for workflows
- **Cross-Feature**: ≥80% coverage for shared services

## Mock Configuration Examples

### Infrastructure Mock (Global - DO NOT MODIFY)

```typescript
// tests/setup.ts
export const mockUseRouter = {
  push: vi.fn(),
  replace: vi.fn(), 
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn()
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/'
}));
```

### Feature Mock Configuration (Modify as Needed)

```typescript
// features/sales-requests/__tests__/test-utils.ts
import { mockUseRouter } from '../../../tests/setup';

export const configureRequestMocks = {
  navigation: {
    redirectToSuccess: () => {
      mockUseRouter.push.mockImplementation((path) => {
        expect(path).toBe('/success');
      });
    }
  },
  
  api: {
    contacts: (data: Contact[]) => {
      // Configure API response without mocking fetch
      mockApiResponses.contacts.mockReturnValue(data);
    }
  }
};
```

## Common Patterns Library

### Form Testing Pattern

```typescript
export const testFormSubmission = async (formName: string, validData: any, onSubmit: any) => {
  render(<FormComponent onSubmit={onSubmit} />);
  
  // Fill form fields
  for (const [field, value] of Object.entries(validData)) {
    await userEvent.type(screen.getByLabelText(new RegExp(field, 'i')), value);
  }
  
  // Submit
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  // Verify
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining(validData));
  });
};
```

### API Testing Pattern  

```typescript
export const testApiEndpoint = async (method: string, path: string, data: any) => {
  const response = await request(app)[method.toLowerCase()](path).send(data);
  return {
    status: response.status,
    body: response.body,
    expectSuccess: () => expect(response.status).toBe(200),
    expectError: (code: number) => expect(response.status).toBe(code)
  };
};
```

## Debugging Guide

### Test Failure Analysis

1. **Router undefined** → Check for global mock overrides
2. **Fetch not mocked** → Use feature test-utils configuration  
3. **Tests affecting each other** → Add afterEach cleanup
4. **Database state issues** → Ensure transaction rollback
5. **Cache pollution** → Clear Redis between tests

### Common Mock Issues

```typescript
// Problem: Router mock returning undefined
// Solution: Import and use global mock
import { mockUseRouter } from '../../../tests/setup';

// Problem: Incomplete fetch mocking
// Solution: Configure responses in test-utils
configureRequestMocks.api.contacts([...]);

// Problem: Test isolation failure
// Solution: Proper cleanup in afterEach
afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  localStorage.clear();
});
```

This playbook prioritizes practical solutions over theoretical purity. Follow these patterns exactly during your restructure to avoid the mock dependency hell that's currently breaking your test suite.