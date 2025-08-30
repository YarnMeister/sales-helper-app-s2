import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    environment: 'jsdom',
    globals: true,
    testTimeout: 10000, // 10 seconds - much more reasonable
    pool: 'forks', // Use forks instead of threads for better memory management
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork to reduce memory usage
      },
    },
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    teardownTimeout: 5000, // 5 second timeout for teardown
    hookTimeout: 5000, // 5 second timeout for hooks
  },
});
