import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the environment check script functionality
const mockCheckEnvironment = vi.fn();

// Mock the dotenv config
vi.mock('dotenv', () => ({
  config: vi.fn()
}));

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment to clean state
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Required Environment Variables', () => {
    const requiredVars = [
      'DATABASE_URL',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'PIPEDRIVE_API_TOKEN'
    ];

    it('should validate all required variables are present', () => {
      // Set all required variables
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
      process.env.PIPEDRIVE_API_TOKEN = 'pipedrive-token';

      const validateRequiredVars = () => {
        const missingVars = [];
        for (const varName of requiredVars) {
          if (!process.env[varName]) {
            missingVars.push(varName);
          }
        }
        return missingVars;
      };

      const missing = validateRequiredVars();
      expect(missing).toEqual([]);
    });

    it('should identify missing required variables', () => {
      // Clear all required variables first
      requiredVars.forEach(varName => {
        delete process.env[varName];
      });

      // Only set some variables
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      // Missing UPSTASH_REDIS_REST_TOKEN and PIPEDRIVE_API_TOKEN

      const validateRequiredVars = () => {
        const missingVars = [];
        for (const varName of requiredVars) {
          if (!process.env[varName]) {
            missingVars.push(varName);
          }
        }
        return missingVars;
      };

      const missing = validateRequiredVars();
      expect(missing).toEqual(['UPSTASH_REDIS_REST_TOKEN', 'PIPEDRIVE_API_TOKEN']);
    });

    it('should throw error for missing variables', () => {
      // Clear all required variables
      requiredVars.forEach(varName => {
        delete process.env[varName];
      });

      const validateAndThrow = () => {
        const missingVars = [];
        for (const varName of requiredVars) {
          if (!process.env[varName]) {
            missingVars.push(varName);
          }
        }

        if (missingVars.length > 0) {
          throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
      };

      expect(() => validateAndThrow()).toThrow('Missing required environment variables: DATABASE_URL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, PIPEDRIVE_API_TOKEN');
    });
  });

  describe('URL Validation', () => {
    it('should validate DATABASE_URL format', () => {
      const validateDatabaseUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(validateDatabaseUrl('postgresql://user:pass@localhost:5432/db')).toBe(true);
      expect(validateDatabaseUrl('postgres://user:pass@host.com:5432/db')).toBe(true);
      expect(validateDatabaseUrl('invalid-url')).toBe(false);
      expect(validateDatabaseUrl('')).toBe(false);
    });

    it('should validate REDIS_URL format', () => {
      const validateRedisUrl = (url: string) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === 'https:' || parsed.protocol === 'redis:';
        } catch {
          return false;
        }
      };

      expect(validateRedisUrl('https://redis.upstash.io')).toBe(true);
      expect(validateRedisUrl('redis://localhost:6379')).toBe(true);
      expect(validateRedisUrl('http://redis.upstash.io')).toBe(false);
      expect(validateRedisUrl('invalid-url')).toBe(false);
    });

    it('should validate complete URL configuration', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';

      const validateUrls = () => {
        const errors = [];

        try {
          new URL(process.env.DATABASE_URL!);
        } catch {
          errors.push('Invalid DATABASE_URL format');
        }

        try {
          new URL(process.env.UPSTASH_REDIS_REST_URL!);
        } catch {
          errors.push('Invalid UPSTASH_REDIS_REST_URL format');
        }

        return errors;
      };

      const errors = validateUrls();
      expect(errors).toEqual([]);
    });
  });

  describe('Environment-Specific Configuration', () => {
    it('should handle development environment', () => {
      process.env.NODE_ENV = 'development';
      process.env.APP_ENV = 'development';

      const getEnvironmentConfig = () => ({
        environment: process.env.APP_ENV || 'development',
        nodeEnv: process.env.NODE_ENV || 'development',
        isDevelopment: process.env.NODE_ENV === 'development',
        isProduction: process.env.NODE_ENV === 'production'
      });

      const config = getEnvironmentConfig();
      expect(config.environment).toBe('development');
      expect(config.nodeEnv).toBe('development');
      expect(config.isDevelopment).toBe(true);
      expect(config.isProduction).toBe(false);
    });

    it('should handle production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.APP_ENV = 'production';

      const getEnvironmentConfig = () => ({
        environment: process.env.APP_ENV || 'development',
        nodeEnv: process.env.NODE_ENV || 'development',
        isDevelopment: process.env.NODE_ENV === 'development',
        isProduction: process.env.NODE_ENV === 'production'
      });

      const config = getEnvironmentConfig();
      expect(config.environment).toBe('production');
      expect(config.nodeEnv).toBe('production');
      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(true);
    });

    it('should default to development when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      delete process.env.APP_ENV;

      const getEnvironmentConfig = () => ({
        environment: process.env.APP_ENV || 'development',
        nodeEnv: process.env.NODE_ENV || 'development',
        isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
        isProduction: process.env.NODE_ENV === 'production'
      });

      const config = getEnvironmentConfig();
      expect(config.environment).toBe('development');
      expect(config.nodeEnv).toBe('development');
      expect(config.isDevelopment).toBe(true);
      expect(config.isProduction).toBe(false);
    });
  });

  describe('Feature-Specific Configuration', () => {
    it('should validate Pipedrive configuration', () => {
      process.env.PIPEDRIVE_API_TOKEN = 'test-token';
      process.env.PIPEDRIVE_SUBMIT_MODE = 'mock';

      const validatePipedriveConfig = () => {
        const config = {
          apiToken: process.env.PIPEDRIVE_API_TOKEN,
          submitMode: process.env.PIPEDRIVE_SUBMIT_MODE || 'mock',
          isValidMode: ['mock', 'live'].includes(process.env.PIPEDRIVE_SUBMIT_MODE || 'mock')
        };

        if (!config.apiToken) {
          throw new Error('PIPEDRIVE_API_TOKEN is required');
        }

        if (!config.isValidMode) {
          throw new Error('PIPEDRIVE_SUBMIT_MODE must be either "mock" or "live"');
        }

        return config;
      };

      const config = validatePipedriveConfig();
      expect(config.apiToken).toBe('test-token');
      expect(config.submitMode).toBe('mock');
      expect(config.isValidMode).toBe(true);
    });

    it('should validate Slack configuration', () => {
      process.env.SLACK_BOT_TOKEN = 'xoxb-test-token';
      process.env.SLACK_CHANNEL_ID = 'C1234567890';

      const validateSlackConfig = () => {
        const config = {
          botToken: process.env.SLACK_BOT_TOKEN,
          channelId: process.env.SLACK_CHANNEL_ID,
          enabled: !!(process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID)
        };

        return config;
      };

      const config = validateSlackConfig();
      expect(config.botToken).toBe('xoxb-test-token');
      expect(config.channelId).toBe('C1234567890');
      expect(config.enabled).toBe(true);
    });

    it('should handle optional Slack configuration', () => {
      delete process.env.SLACK_BOT_TOKEN;
      delete process.env.SLACK_CHANNEL_ID;

      const validateSlackConfig = () => {
        const config = {
          botToken: process.env.SLACK_BOT_TOKEN,
          channelId: process.env.SLACK_CHANNEL_ID,
          enabled: !!(process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID)
        };

        return config;
      };

      const config = validateSlackConfig();
      expect(config.botToken).toBeUndefined();
      expect(config.channelId).toBeUndefined();
      expect(config.enabled).toBe(false);
    });

    it('should validate database configuration with connection limits', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.DB_MAX_CONNECTIONS = '20';
      process.env.DB_CONNECTION_TIMEOUT = '30000';
      process.env.DB_QUERY_TIMEOUT = '60000';

      const validateDatabaseConfig = () => {
        const config = {
          url: process.env.DATABASE_URL!,
          maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
          connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
          queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
          environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development'
        };

        if (!config.url) {
          throw new Error('DATABASE_URL is required');
        }

        if (config.maxConnections <= 0) {
          throw new Error('DB_MAX_CONNECTIONS must be a positive number');
        }

        return config;
      };

      const config = validateDatabaseConfig();
      expect(config.url).toBe('postgresql://test:test@localhost:5432/test');
      expect(config.maxConnections).toBe(20);
      expect(config.connectionTimeout).toBe(30000);
      expect(config.queryTimeout).toBe(60000);
    });
  });

  describe('Configuration Summary', () => {
    it('should generate complete configuration summary', () => {
      // Set up complete environment
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'redis-token';
      process.env.PIPEDRIVE_API_TOKEN = 'pipedrive-token';
      process.env.PIPEDRIVE_SUBMIT_MODE = 'mock';
      process.env.SLACK_BOT_TOKEN = 'slack-token';

      const generateConfigSummary = () => {
        return {
          environment: process.env.NODE_ENV || 'development',
          pipedriveMode: process.env.PIPEDRIVE_SUBMIT_MODE || 'mock',
          database: process.env.DATABASE_URL ? 'configured' : 'missing',
          cache: process.env.UPSTASH_REDIS_REST_URL ? 'configured' : 'missing',
          slackBot: process.env.SLACK_BOT_TOKEN ? 'enabled' : 'disabled'
        };
      };

      const summary = generateConfigSummary();
      expect(summary.environment).toBe('development');
      expect(summary.pipedriveMode).toBe('mock');
      expect(summary.database).toBe('configured');
      expect(summary.cache).toBe('configured');
      expect(summary.slackBot).toBe('enabled');
    });

    it('should mask sensitive information in summary', () => {
      process.env.DATABASE_URL = 'postgresql://user:password@host:5432/db';
      process.env.PIPEDRIVE_API_TOKEN = 'very-secret-token';

      const generateSecureSummary = () => {
        const maskUrl = (url: string) => {
          try {
            const parsed = new URL(url);
            return `${parsed.protocol}//${parsed.username}:***@${parsed.host}${parsed.pathname}`;
          } catch {
            return 'invalid-url';
          }
        };

        const maskToken = (token: string) => {
          if (!token) return 'not-set';
          return token.substring(0, 8) + '...';
        };

        return {
          database: process.env.DATABASE_URL ? maskUrl(process.env.DATABASE_URL) : 'not-configured',
          pipedriveToken: process.env.PIPEDRIVE_API_TOKEN ? maskToken(process.env.PIPEDRIVE_API_TOKEN) : 'not-set'
        };
      };

      const summary = generateSecureSummary();
      expect(summary.database).toBe('postgresql://user:***@host:5432/db');
      expect(summary.pipedriveToken).toBe('very-sec...');
    });
  });
});
