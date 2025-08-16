import { vi, beforeAll, afterAll, afterEach } from 'vitest';
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
beforeAll(async () => {
  try {
    // Set up test database tables
    await setupTestDatabase();
    console.log('Test database setup completed');
  } catch (error) {
    console.warn('Test database setup failed, continuing with mocks:', error);
  }
});

// Global test teardown
afterAll(async () => {
  try {
    // Clean up test data
    await testDataManager.nuclearCleanup();
    
    // Tear down test database
    await teardownTestDatabase();
    console.log('Test database teardown completed');
  } catch (error) {
    console.warn('Test database teardown failed:', error);
  }
});

// Clean up after each test
afterEach(async () => {
  await testDataManager.cleanup();
});
