import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    environment: 'jsdom',
    globals: true,
    testTimeout: 5000, // 5 seconds - much more aggressive timeout
    pool: 'forks', // Use forks instead of threads for better memory management
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork to reduce memory usage
      },
    },
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    teardownTimeout: 3000, // 3 second timeout for teardown
    hookTimeout: 3000, // 3 second timeout for hooks
    // Add global timeout to prevent infinite hangs
    globalSetup: undefined,
    // Disable coverage for now to speed up tests
    coverage: {
      enabled: false
    }
  },
});
