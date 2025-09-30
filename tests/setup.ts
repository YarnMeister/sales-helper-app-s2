import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { testDataManager } from './_utils/test-helpers';

// Force test environment
process.env.APP_ENV = 'test';

// Mock environment variables for tests - use in-memory database
process.env.DATABASE_URL = 'sqlite::memory:'; // Use in-memory SQLite for tests
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.PIPEDRIVE_API_TOKEN = 'test-token';
process.env.PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';
process.env.PIPEDRIVE_SUBMIT_MODE = 'mock';

// Mock Next.js router and navigation
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  defaultLocale: 'en',
  domainLocales: [],
  isPreview: false,
};

const mockSearchParams = {
  get: vi.fn((key: string) => {
    // Return default values for common search params
    if (key === 'period') return '7d';
    if (key === 'metric-id') return 'manufacturing-lead-time';
    return null;
  }),
  has: vi.fn(() => false),
  forEach: vi.fn(),
  entries: vi.fn(() => []),
  keys: vi.fn(() => []),
  values: vi.fn(() => []),
  toString: vi.fn(() => ''),
};

const mockParams = {
  'metric-id': 'manufacturing-lead-time',
};

// Mock Next.js navigation modules
vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useRouter: () => mockRouter,
    useSearchParams: () => mockSearchParams,
    useParams: () => mockParams,
    usePathname: () => '/',
    useSelectedLayoutSegment: () => null,
    useSelectedLayoutSegments: () => [],
    redirect: vi.fn(),
    notFound: vi.fn(),
  };
});

// Mock Next.js router (legacy)
vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
  withRouter: (Component: any) => Component,
}));

// Mock global fetch
global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, options?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.toString();
  
  // Default mock responses for common API endpoints
  const mockResponses: Record<string, any> = {
    '/api/products': {
      ok: true,
      data: [
        {
          pipedriveProductId: 1,
          name: 'Test Product 1',
          code: 'TP1',
          category: 'Test Category',
          price: 100,
          quantity: 1,
          shortDescription: 'Test product description'
        }
      ]
    },
    '/api/requests': {
      ok: true,
      data: [
        {
          id: 'test-request-id',
          request_id: 'REQ-001',
          status: 'draft',
          line_items: []
        }
      ]
    },
    '/api/flow/metrics': {
      success: true,
      data: [
        {
          id: 'lead-conversion',
          title: 'Lead Conversion Time',
          mainMetric: '5',
          totalDeals: 25,
          avg_min_days: 3.1,
          avg_max_days: 7.8,
          metric_comment: 'Good performance'
        },
        {
          id: 'quote-conversion',
          title: 'Quote Conversion Time',
          mainMetric: '8',
          totalDeals: 18,
          avg_min_days: 5.2,
          avg_max_days: 12.1,
          metric_comment: 'Needs improvement'
        }
      ]
    },
    '/api/pipedrive/deal-flow-data': {
      success: true,
      data: [
        {
          id: 'deal-1',
          deal_id: 12345,
          stage_id: 'stage-1',
          stage_name: 'Qualification',
          entry_date: '2024-01-01',
          exit_date: '2024-01-05',
          days_in_stage: 4
        }
      ]
    }
  };

  // Find matching response by removing query parameters
  const baseUrl = url.split('?')[0];
  const response = mockResponses[baseUrl];
  
  if (response) {
    return Promise.resolve({
      ok: response.ok !== undefined ? response.ok : true,
      json: async () => response,
      status: 200,
      statusText: 'OK'
    } as Response);
  }

  // Default response for unmatched URLs
  return Promise.resolve({
    ok: true,
    json: async () => ({ ok: true, data: [] }),
    status: 200,
    statusText: 'OK'
  } as Response);
});

// Mock the environment validation
vi.mock('../../lib/env', () => ({
  validateEnvironment: vi.fn(() => true),
  env: {
    DATABASE_URL: 'sqlite::memory:',
    UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
    PIPEDRIVE_API_TOKEN: 'test-token',
    PIPEDRIVE_BASE_URL: 'https://api.pipedrive.com/v1',
    PIPEDRIVE_SUBMIT_MODE: 'mock',
    APP_ENV: 'test'
  }
}));

// Mock the database configuration to use test tables
vi.mock('../../lib/config/test-env', () => ({
  getDatabaseConfig: () => ({
    env: 'test',
    tablePrefix: 'test_',
    databaseUrl: 'sqlite::memory:',
    tables: {
      requests: 'test_requests',
      kvCache: 'test_kv_cache', 
      pipedriveSubmissions: 'test_pipedrive_submissions'
    }
  }),
  getRedisConfig: () => ({
    redis: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      setex: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      ttl: vi.fn().mockResolvedValue(-1),
      scan: vi.fn().mockResolvedValue(['0', []]),
      keys: vi.fn().mockResolvedValue([]),
      pipeline: vi.fn(() => ({
        get: vi.fn().mockResolvedValue(null),
        ttl: vi.fn().mockResolvedValue(-1),
        exec: vi.fn().mockResolvedValue([null, -1])
      }))
    },
    keyPrefix: 'test:',
    getKey: (key: string) => `test:${key}`
  }),
  getTestDb: () => vi.fn().mockResolvedValue([]),
  getTableName: (table: string) => `test_${table}`
}));

// Mock the Redis client creation function with proper implementation
vi.mock('../../lib/cache', async () => {
  const mockRedisClient = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(-1),
    scan: vi.fn().mockResolvedValue(['0', []]),
    keys: vi.fn().mockResolvedValue([]),
    pipeline: vi.fn(() => ({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      setex: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      ttl: vi.fn().mockResolvedValue(-1),
      exec: vi.fn().mockResolvedValue([null, -1])
    }))
  };
  
  // Mock Redis class constructor
  const MockRedis = vi.fn().mockImplementation(() => mockRedisClient);
  
  return {
    getRedisClient: vi.fn(() => mockRedisClient),
    Redis: MockRedis,
    KVCache: vi.fn().mockImplementation(() => ({
      redis: mockRedisClient,
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      bust: vi.fn().mockResolvedValue(undefined),
      bustPattern: vi.fn().mockResolvedValue(0),
      getStats: vi.fn().mockResolvedValue({
        memory_usage: 'Not available',
        connected_clients: 0,
        total_commands_processed: 0
      })
    })),
    cache: {
      redis: mockRedisClient,
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      bust: vi.fn().mockResolvedValue(undefined),
      bustPattern: vi.fn().mockResolvedValue(0),
      getStats: vi.fn().mockResolvedValue({
        memory_usage: 'Not available',
        connected_clients: 0,
        total_commands_processed: 0
      })
    }
  };
});

// Mock Neon database - use in-memory SQLite instead
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => {
    // Return a mock database client that does nothing
    return vi.fn().mockResolvedValue([]);
  }),
  neonConfig: {
    fetchConnectionCache: true
  }
}));

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

// Global test setup
beforeAll(async () => {
  console.log('Test environment setup completed - using in-memory database');
});

// Global test teardown
afterAll(async () => {
  try {
    // Clean up test data
    await testDataManager.nuclearCleanup();
    console.log('Test environment teardown completed');
  } catch (error) {
    console.warn('Test teardown warning:', error);
  }
});

// Reset mocks and clean up between tests
beforeEach(() => {
  vi.clearAllMocks();
  // Reset router mock functions
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.back.mockClear();
  mockSearchParams.get.mockClear();
  // Reset fetch mock
  (global.fetch as any).mockClear();
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data
  await testDataManager.cleanup();
  
  // Reset all mocks
  vi.resetAllMocks();
  
  // Clear any global state
  if (typeof window !== 'undefined') {
    // Clear localStorage and sessionStorage (guard for environments without full Web Storage API)
    if (window.localStorage && typeof window.localStorage.clear === 'function') {
      window.localStorage.clear();
    }
    if (window.sessionStorage && typeof window.sessionStorage.clear === 'function') {
      window.sessionStorage.clear();
    }
  }
});
