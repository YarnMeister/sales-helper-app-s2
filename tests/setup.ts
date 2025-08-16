import { vi } from 'vitest';

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.PIPEDRIVE_API_TOKEN = 'test-token';
process.env.PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';
process.env.PIPEDRIVE_SUBMIT_MODE = 'mock';
process.env.APP_ENV = 'development';

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
    APP_ENV: 'development'
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
    scan: vi.fn(),
    pipeline: vi.fn(() => ({
      get: vi.fn(),
      ttl: vi.fn(),
      exec: vi.fn()
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
