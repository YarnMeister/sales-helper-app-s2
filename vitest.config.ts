import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    environment: 'jsdom',
    globals: true,
    testTimeout: 10000, // 10 seconds - reasonable timeout
    pool: 'forks', // Use forks for better isolation
    poolOptions: {
      forks: {
        singleFork: false, // Use multiple forks for better isolation
        isolate: true, // Ensure complete isolation
      },
    },
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    teardownTimeout: 5000, // 5 second timeout for teardown
    hookTimeout: 5000, // 5 second timeout for hooks
    // Add global timeout to prevent infinite hangs
    globalSetup: undefined,
    // Disable coverage for now to speed up tests
    coverage: {
      enabled: false
    },
    // Ensure tests run in isolation
    isolate: true,
    // Clear mocks between tests
    mockReset: true,
    // Clear all mocks between tests
    clearMocks: true,
    // Restore mocks between tests
    restoreMocks: true,
    // Compact reporter for less verbose output
    reporters: ["dot"],
    // Fail fast
    bail: 1,
    // Suppress console.log noise
    silent: true,
    // Filter out known verbose logs
    onConsoleLog(log) {
      // Drop known verbose logs but keep errors
      if (
        /ReactDOMTestUtils\.act|Warning: An update to|DeprecationWarning|ResizeObserver|IntersectionObserver/i.test(log) ||
        log.includes('Redis client was initialized without url or token') ||
        log.includes('The \'url\' property is missing or undefined') ||
        log.includes('The \'token\' property is missing or undefined')
      ) return false;
    },
  },
});
