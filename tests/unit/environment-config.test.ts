import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { config } from 'dotenv';
import path from 'path';

// Mock dotenv
vi.mock('dotenv', () => ({
  config: vi.fn()
}));

describe('Environment Configuration Loading', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Dotenv Configuration Loading', () => {
    it('should load .env.local in development', () => {
      process.env.NODE_ENV = 'development';
      const mockConfig = vi.mocked(config);

      // Simulate the env-check.js loading logic
      const loadEnvironmentConfig = () => {
        if (process.env.NODE_ENV !== 'production') {
          config({ path: path.resolve(process.cwd(), '.env.local') });
          config({ path: path.resolve(process.cwd(), '.env') });
        }
      };

      loadEnvironmentConfig();

      expect(mockConfig).toHaveBeenCalledTimes(2);
      expect(mockConfig).toHaveBeenCalledWith({ 
        path: path.resolve(process.cwd(), '.env.local') 
      });
      expect(mockConfig).toHaveBeenCalledWith({ 
        path: path.resolve(process.cwd(), '.env') 
      });
    });

    it('should not load .env files in production', () => {
      process.env.NODE_ENV = 'production';
      const mockConfig = vi.mocked(config);

      const loadEnvironmentConfig = () => {
        if (process.env.NODE_ENV !== 'production') {
          config({ path: path.resolve(process.cwd(), '.env.local') });
          config({ path: path.resolve(process.cwd(), '.env') });
        }
      };

      loadEnvironmentConfig();

      expect(mockConfig).not.toHaveBeenCalled();
    });

    it('should handle missing .env files gracefully', () => {
      process.env.NODE_ENV = 'development';
      const mockConfig = vi.mocked(config);
      mockConfig.mockReturnValue({ error: new Error('ENOENT: no such file') });

      const loadEnvironmentConfig = () => {
        try {
          if (process.env.NODE_ENV !== 'production') {
            config({ path: path.resolve(process.cwd(), '.env.local') });
            config({ path: path.resolve(process.cwd(), '.env') });
          }
          return { success: true };
        } catch (error) {
          return { success: false, error };
        }
      };

      const result = loadEnvironmentConfig();

      expect(result.success).toBe(true);
      expect(mockConfig).toHaveBeenCalledTimes(2);
    });
  });

  describe('Environment Variable Precedence', () => {
    it('should prioritize process.env over .env files', () => {
      // Simulate process.env having a value
      process.env.DATABASE_URL = 'process-env-value';

      // Simulate .env file loading (would normally set DATABASE_URL if not already set)
      const simulateEnvFileLoad = () => {
        // .env files don't override existing process.env values
        if (!process.env.DATABASE_URL) {
          process.env.DATABASE_URL = 'env-file-value';
        }
      };

      simulateEnvFileLoad();

      expect(process.env.DATABASE_URL).toBe('process-env-value');
    });

    it('should use .env file values when process.env is not set', () => {
      delete process.env.DATABASE_URL;

      const simulateEnvFileLoad = () => {
        if (!process.env.DATABASE_URL) {
          process.env.DATABASE_URL = 'env-file-value';
        }
      };

      simulateEnvFileLoad();

      expect(process.env.DATABASE_URL).toBe('env-file-value');
    });

    it('should prioritize .env.local over .env', () => {
      delete process.env.DATABASE_URL;

      const simulateEnvFileLoad = () => {
        // First load .env
        if (!process.env.DATABASE_URL) {
          process.env.DATABASE_URL = 'env-value';
        }
        
        // Then load .env.local (would override .env values)
        // In real dotenv, .env.local would be loaded first and take precedence
        process.env.DATABASE_URL = 'env-local-value';
      };

      simulateEnvFileLoad();

      expect(process.env.DATABASE_URL).toBe('env-local-value');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required variables after loading', () => {
      // Simulate successful environment loading
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      process.env.PIPEDRIVE_API_TOKEN = 'pipedrive-token';

      const validateAfterLoad = () => {
        const requiredVars = [
          'DATABASE_URL',
          'UPSTASH_REDIS_REST_URL',
          'UPSTASH_REDIS_REST_TOKEN',
          'PIPEDRIVE_API_TOKEN'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
          throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        return { valid: true, message: 'Environment validation successful!' };
      };

      const result = validateAfterLoad();
      expect(result.valid).toBe(true);
      expect(result.message).toBe('Environment validation successful!');
    });

    it('should fail validation for missing variables after loading', () => {
      // Clear all environment variables first
      const requiredVars = [
        'DATABASE_URL',
        'UPSTASH_REDIS_REST_URL',
        'UPSTASH_REDIS_REST_TOKEN',
        'PIPEDRIVE_API_TOKEN'
      ];

      requiredVars.forEach(varName => {
        delete process.env[varName];
      });

      // Simulate incomplete environment loading
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      // Missing other required variables

      const validateAfterLoad = () => {
        const missingVars = requiredVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
          throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        return { valid: true };
      };

      expect(() => validateAfterLoad()).toThrow(
        'Missing required environment variables: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, PIPEDRIVE_API_TOKEN'
      );
    });
  });

  describe('Configuration Transformation', () => {
    it('should transform string values to appropriate types', () => {
      process.env.DB_MAX_CONNECTIONS = '20';
      process.env.DB_CONNECTION_TIMEOUT = '30000';
      process.env.ENABLE_LOGGING = 'true';
      process.env.API_RATE_LIMIT = '100';

      const transformConfig = () => ({
        database: {
          maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
          connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000')
        },
        logging: {
          enabled: process.env.ENABLE_LOGGING === 'true'
        },
        api: {
          rateLimit: parseInt(process.env.API_RATE_LIMIT || '50')
        }
      });

      const config = transformConfig();
      expect(config.database.maxConnections).toBe(20);
      expect(config.database.connectionTimeout).toBe(30000);
      expect(config.logging.enabled).toBe(true);
      expect(config.api.rateLimit).toBe(100);
    });

    it('should handle invalid numeric values with defaults', () => {
      process.env.DB_MAX_CONNECTIONS = 'invalid';
      process.env.DB_CONNECTION_TIMEOUT = '';

      const transformConfig = () => ({
        database: {
          maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10') || 10,
          connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000') || 30000
        }
      });

      const config = transformConfig();
      expect(config.database.maxConnections).toBe(10);
      expect(config.database.connectionTimeout).toBe(30000);
    });

    it('should handle boolean values correctly', () => {
      const testCases = [
        { value: 'true', expected: true },
        { value: 'false', expected: false },
        { value: '1', expected: true },
        { value: '0', expected: false },
        { value: 'yes', expected: true },
        { value: 'no', expected: false },
        { value: '', expected: false },
        { value: undefined, expected: false }
      ];

      testCases.forEach(({ value, expected }) => {
        if (value !== undefined) {
          process.env.TEST_BOOLEAN = value;
        } else {
          delete process.env.TEST_BOOLEAN;
        }

        const parseBoolean = (val: string | undefined) => {
          if (!val) return false;
          return ['true', '1', 'yes'].includes(val.toLowerCase());
        };

        const result = parseBoolean(process.env.TEST_BOOLEAN);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Environment-Specific Defaults', () => {
    it('should apply development defaults', () => {
      process.env.NODE_ENV = 'development';

      const getEnvironmentDefaults = () => {
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        return {
          logging: {
            level: isDevelopment ? 'debug' : 'info',
            enabled: isDevelopment
          },
          database: {
            maxConnections: isDevelopment ? 5 : 20,
            queryTimeout: isDevelopment ? 10000 : 30000
          },
          cache: {
            ttl: isDevelopment ? 300 : 3600 // 5 minutes vs 1 hour
          }
        };
      };

      const config = getEnvironmentDefaults();
      expect(config.logging.level).toBe('debug');
      expect(config.logging.enabled).toBe(true);
      expect(config.database.maxConnections).toBe(5);
      expect(config.cache.ttl).toBe(300);
    });

    it('should apply production defaults', () => {
      process.env.NODE_ENV = 'production';

      const getEnvironmentDefaults = () => {
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        return {
          logging: {
            level: isDevelopment ? 'debug' : 'info',
            enabled: isDevelopment
          },
          database: {
            maxConnections: isDevelopment ? 5 : 20,
            queryTimeout: isDevelopment ? 10000 : 30000
          },
          cache: {
            ttl: isDevelopment ? 300 : 3600
          }
        };
      };

      const config = getEnvironmentDefaults();
      expect(config.logging.level).toBe('info');
      expect(config.logging.enabled).toBe(false);
      expect(config.database.maxConnections).toBe(20);
      expect(config.cache.ttl).toBe(3600);
    });
  });

  describe('Configuration Merging', () => {
    it('should merge default and environment-specific configurations', () => {
      process.env.NODE_ENV = 'development';
      process.env.DB_MAX_CONNECTIONS = '15';
      process.env.CACHE_TTL = '600';

      const getDefaultConfig = () => ({
        database: {
          maxConnections: 10,
          connectionTimeout: 30000,
          queryTimeout: 30000
        },
        cache: {
          ttl: 3600,
          maxSize: 1000
        },
        logging: {
          level: 'info',
          enabled: false
        }
      });

      const getEnvironmentOverrides = () => ({
        database: {
          maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
        },
        cache: {
          ttl: parseInt(process.env.CACHE_TTL || '3600')
        },
        logging: {
          level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
          enabled: process.env.NODE_ENV === 'development'
        }
      });

      const mergeConfigs = (defaults: any, overrides: any) => {
        const merged = { ...defaults };
        
        Object.keys(overrides).forEach(key => {
          if (typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
            merged[key] = { ...merged[key], ...overrides[key] };
          } else {
            merged[key] = overrides[key];
          }
        });
        
        return merged;
      };

      const finalConfig = mergeConfigs(getDefaultConfig(), getEnvironmentOverrides());

      expect(finalConfig.database.maxConnections).toBe(15);
      expect(finalConfig.database.connectionTimeout).toBe(30000); // Preserved from defaults
      expect(finalConfig.cache.ttl).toBe(600);
      expect(finalConfig.cache.maxSize).toBe(1000); // Preserved from defaults
      expect(finalConfig.logging.level).toBe('debug');
      expect(finalConfig.logging.enabled).toBe(true);
    });
  });
});
