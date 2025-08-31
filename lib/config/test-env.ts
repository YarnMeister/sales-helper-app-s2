import { neon, neonConfig } from '@neondatabase/serverless';
import { Redis } from '@upstash/redis';

// Environment detection
export const getAppEnv = () => {
  if (process.env.NODE_ENV === 'test' || process.env.APP_ENV === 'test') {
    return 'test';
  }
  if (process.env.VERCEL_ENV === 'preview') {
    return 'preview';
  }
  return process.env.NODE_ENV || 'development';
};

// Database configuration with proper test isolation
export const getDatabaseConfig = () => {
  const env = getAppEnv();
  
  // Use different table prefixes for test environment
  const tablePrefix = env === 'test' ? 'test_' : '';
  
  return {
    env,
    tablePrefix,
    // Use same Neon instance but with prefixed tables for tests
    databaseUrl: process.env.DATABASE_URL!,
    tables: {
      requests: `${tablePrefix}requests`,
      kvCache: `${tablePrefix}kv_cache`,
      pipedriveSubmissions: `${tablePrefix}pipedrive_submissions`
    }
  };
};

// Redis configuration with test namespace
export const getRedisConfig = () => {
  const env = getAppEnv();
  const keyPrefix = env === 'test' ? 'test:' : '';
  
  return {
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }),
    keyPrefix,
    // Helper to get namespaced keys
    getKey: (key: string) => `${keyPrefix}${key}`
  };
};

// Neon database client with environment awareness
let testDb: any = null;

export const getTestDb = () => {
  if (!testDb) {
    const config = getDatabaseConfig();
    
    // Configure Neon for test environment
    neonConfig.fetchConnectionCache = true;
    
    testDb = neon(config.databaseUrl);
  }
  
  return testDb;
};

// Helper to get correct table name based on environment
export const getTableName = (table: keyof ReturnType<typeof getDatabaseConfig>['tables']) => {
  const config = getDatabaseConfig();
  return config.tables[table];
};
