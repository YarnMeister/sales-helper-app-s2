# 🧪 Sales Helper App — Testing Playbook

This guide defines best practices for writing and maintaining tests in the modularised architecture of the Sales Helper App.

---

## 📁 Folder Structure

```
app/
└── features/
    └── my-feature/
        ├── components/
        ├── api/
        ├── hooks/
        ├── utils/
        └── __tests__/
            ├── test-utils.ts         # Local test helpers/mocks
            ├── MyComponent.test.tsx  # Unit or component tests
            ├── page.test.tsx         # Page-level integration test
            └── factories.ts          # Feature-specific data builders
```

> ✅ Always colocate test files and mocks with their respective feature module.

---

## 🧱 Test Types and Scope

| Test Type       | Folder                     | Scope                                                 | Tools                          |
|-----------------|----------------------------|--------------------------------------------------------|--------------------------------|
| Unit            | `__tests__/*.test.ts`      | Pure functions, helpers, validators                    | Vitest                         |
| Component       | `__tests__/*.test.tsx`     | UI behaviour, form validation, rendering               | RTL + jsdom                    |
| Integration     | `tests/integration/`       | API + DB flows, cache handling, backend coordination   | Vitest + supertest             |
| E2E Page Test   | `__tests__/page.test.tsx`  | Page load, fetch mocking, navigation                   | RTL + Vitest                   |
| Manual E2E      | N/A                        | Full browser testing (optional)                        | Playwright/Cypress (future)    |

---

## 🧰 Test Utility Guidelines

### Global Mocks (`/tests/`)
Use only for:
- Router mocking utilities (`mockUseRouter`)
- Global environment config (`vi.stubEnv`)
- Shared test config in `setup.ts`

### Feature-Specific Mocks (`/features/x/__tests__/`)
- Local API handlers: `mockFetchContacts`, `mockSubmitRequest`
- Feature-specific helpers: `renderWithRouter`, `renderWithSession`
- Factories: `buildContact()`, `buildLineItem()`

---

## 🧼 Test Isolation Rules

Always reset after each test to avoid flakiness:

```ts
afterEach(() => {
  vi.restoreAllMocks();         // Clear mock implementations
  cleanup();                    // React Testing Library
  localStorage.clear();         // Offline logic
});
```

---

## 🧪 Recommended Patterns

### Component Tests
```ts
describe('ContactForm', () => {
  it('renders required fields', () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/Mine Name/i)).toBeInTheDocument();
  });

  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn();
    render(<ContactForm onSubmit={onSubmit} />);
    userEvent.type(screen.getByLabelText(/Mine Name/i), 'Impumelelo');
    fireEvent.submit(screen.getByRole('form'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
```

### API Integration Tests
```ts
describe('POST /api/requests', () => {
  it('stores a valid request in the DB', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/requests',
      payload: buildRequest()
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({ ok: true });
  });
});
```

---

## ✅ DOs and ❌ DON’Ts

| ✅ DO                                             | ❌ DON’T                                               |
|--------------------------------------------------|--------------------------------------------------------|
| Use factories for realistic test data            | Hardcode raw JSON blobs in every test                 |
| Keep feature test suites isolated                | Add logic to global `setup.ts`                        |
| Name tests by intent (`renders`, `submits`, etc) | Use vague test names like `it('works')`               |
| Mock Pipedrive fetches using scoped helpers      | Override `fetch` inline in test body                  |
| Use `vi.mock()` only at file/module boundaries   | Patch modules deep inside test functions              |
| Separate component vs page vs API tests clearly  | Mix rendering and fetch mocking in unit tests         |

---

## 🔁 Lifecycle Reminders

- `beforeAll()` → load expensive test data (e.g., global metrics config)
- `beforeEach()` → setup test environment (e.g., session context)
- `afterEach()` → cleanup
- `afterAll()` → teardown (if needed for DB or Redis)

---

## 🧪 Lint Rules & CI

- Tests run automatically via `npm run test`
- Watch mode: `npm run test:watch`
- CI failure if tests break or coverage drops
- Add `@vitest-environment jsdom` for browser-only tests

---

## 📊 Coverage Goals

- 🧪 Unit + Component: ≥ 90%
- 🔄 Integration flows: ≥ 80%
- 📉 Legacy files allowed lower thresholds if isolated

---

## 🛠️ Tooling References

- [Vitest Docs](https://vitest.dev)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [msw (Mock Service Worker)](https://mswjs.io/) *(optional for future browser mocking)*

---

> ℹ️ Keep this file updated as test conventions evolve with the architecture.
