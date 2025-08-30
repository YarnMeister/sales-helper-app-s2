import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    environment: 'jsdom',
    globals: true,
    testTimeout: 180000, // 3 minutes
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
