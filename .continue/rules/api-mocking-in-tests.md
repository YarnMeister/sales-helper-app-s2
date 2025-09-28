---
globs: "['tests/**/*.test.*']"
---

Always mock API calls in tests using vi.fn() and provide appropriate mock responses. Never make actual API calls in tests. Use the fetch mocking pattern established in setup.ts.