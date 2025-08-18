import { z } from 'zod';
import { logInfo, logError } from './log';

// Simplified environment schema for Neon + Upstash
const EnvSchema = z.object({
  APP_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Neon Postgres - single DATABASE_URL for both environments
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  
  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid UPSTASH_REDIS_REST_URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),
  
  // Pipedrive Configuration
  PIPEDRIVE_API_TOKEN: z.string().min(1),
  PIPEDRIVE_BASE_URL: z.string().url().default('https://api.pipedrive.com/v1'),
  
  // External Submit Mode - drives both Slack and Pipedrive submissions
  EXTERNAL_SUBMIT_MODE: z.enum(['live', 'mock']).default('mock'),
  
  // Slack Configuration
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_CHANNEL_LIVE: z.string().default('#sales-checkins'),
  SLACK_CHANNEL_MOCK: z.string().default('#sales-checkins-test'),
});

// Validate and parse environment variables
const validateEnv = () => {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
};

// Export validated environment configuration
export const env = validateEnv();

// Database configuration helper
export const getDatabaseConfig = () => {
  return {
    url: env.DATABASE_URL,
    environment: env.APP_ENV
  };
};

// Cache configuration helper
export const getCacheConfig = () => {
  return {
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
    environment: env.APP_ENV
  };
};

// Validate environment on module load
export const validateEnvironment = () => {
  try {
    const dbConfig = getDatabaseConfig();
    const cacheConfig = getCacheConfig();
    
    logInfo(`Environment validated successfully`, { 
      environment: env.APP_ENV,
      externalSubmitMode: env.EXTERNAL_SUBMIT_MODE,
      hasDatabase: !!dbConfig.url,
      hasCache: !!cacheConfig.url
    });
    return true;
  } catch (error) {
    logError(`Environment validation failed`, { error: (error as Error).message });
    throw error;
  }
};
