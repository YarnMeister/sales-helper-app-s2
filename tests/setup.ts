import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { setupTestDatabase, teardownTestDatabase } from './_setup/setup-test-db';
import { testDataManager } from './_utils/test-helpers';

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.PIPEDRIVE_API_TOKEN = 'test-token';
process.env.PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';
process.env.PIPEDRIVE_SUBMIT_MODE = 'mock';
process.env.APP_ENV = 'test'; // Set to test environment

// Mock the environment validation
vi.mock('../../lib/env', () => ({
  validateEnvironment: vi.fn(() => true),
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
    PIPEDRIVE_API_TOKEN: 'test-token',
    PIPEDRIVE_BASE_URL: 'https://api.pipedrive.com/v1',
    PIPEDRIVE_SUBMIT_MODE: 'mock',
    APP_ENV: 'test'
  }
}));

// Mock Redis client
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    ttl: vi.fn(),
    scan: vi.fn().mockResolvedValue(['0', []]),
    keys: vi.fn(),
    pipeline: vi.fn(() => ({
      get: vi.fn(),
      ttl: vi.fn(),
      exec: vi.fn().mockResolvedValue([null, -1])
    }))
  }))
}));

// Mock Neon database
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => vi.fn()),
  neonConfig: {
    fetchConnectionCache: true
  }
}));

// Global test setup
beforeAll(() => {
  // Mock ResizeObserver for Recharts and other chart libraries
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock console methods to reduce noise in tests
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.warn = vi.fn((...args) => {
    // Only show warnings for non-mock related issues
    const message = args[0];
    if (typeof message === 'string' && !message.includes('Mock fetch:') && !message.includes('act(')) {
      originalConsoleWarn(...args);
    }
  });
  
  console.error = vi.fn((...args) => {
    // Only show errors for non-React testing issues
    const message = args[0];
    if (typeof message === 'string' && !message.includes('Warning: An update to') && !message.includes('act(')) {
      originalConsoleError(...args);
    }
  });
});

// Global test teardown
afterAll(() => {
  vi.clearAllMocks();
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});
