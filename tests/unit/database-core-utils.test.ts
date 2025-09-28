import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getTableName,
  getRequestsTableName,
  getSiteVisitsTableName,
  checkDbHealth,
  generateRequestId,
  validateContactJsonb,
  buildWhereClause,
  buildOrderByClause,
  buildLimitOffsetClause,
  validateDatabaseConfig,
  getDatabaseConfig,
  formatQueryForLogging
} from '../../lib/database/core/utils';
import { DatabaseConfig, FilterConditions, QueryOptions } from '../../lib/database/core/types';

// Mock the connection module
vi.mock('../../lib/database/core/connection', () => ({
  getDatabaseConnection: vi.fn()
}));

// Mock the logging functions
vi.mock('../../lib/log', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  withPerformanceLogging: vi.fn((label, context, operation) => operation())
}));

describe('Database Core Utils', () => {
  const mockSql = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    const { getDatabaseConnection } = require('../../lib/database/core/connection');
    vi.mocked(getDatabaseConnection).mockReturnValue(mockSql);
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
    delete process.env.DB_MAX_CONNECTIONS;
    delete process.env.DB_CONNECTION_TIMEOUT;
    delete process.env.DB_QUERY_TIMEOUT;
  });

  describe('getTableName', () => {
    it('should return mock table name in development environment', () => {
      process.env.NODE_ENV = 'development';
      
      const tableName = getTableName('requests');
      
      expect(tableName).toBe('mock_requests');
    });

    it('should return real table name in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const tableName = getTableName('requests');
      
      expect(tableName).toBe('requests');
    });

    it('should return real table name when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      
      const tableName = getTableName('requests');
      
      expect(tableName).toBe('requests');
    });

    it('should log table name selection', () => {
      process.env.NODE_ENV = 'development';
      
      getTableName('requests');
      
      const { logInfo } = require('../../lib/log');
      expect(logInfo).toHaveBeenCalledWith(
        'Table name selected',
        {
          environment: 'development',
          baseTableName: 'requests',
          selectedTableName: 'mock_requests',
          isMock: true
        }
      );
    });
  });

  describe('getRequestsTableName', () => {
    it('should return correct requests table name', () => {
      process.env.NODE_ENV = 'development';
      
      const tableName = getRequestsTableName();
      
      expect(tableName).toBe('mock_requests');
    });
  });

  describe('getSiteVisitsTableName', () => {
    it('should return correct site visits table name', () => {
      process.env.NODE_ENV = 'production';
      
      const tableName = getSiteVisitsTableName();
      
      expect(tableName).toBe('site_visits');
    });
  });

  describe('checkDbHealth', () => {
    it('should return healthy status when database responds', async () => {
      mockSql.mockResolvedValue([{ health_check: 1 }]);
      
      const health = await checkDbHealth();
      
      expect(health).toEqual({
        status: 'healthy',
        connected: true,
        responseTime: expect.any(Number),
        lastCheck: expect.any(String)
      });
      expect(mockSql).toHaveBeenCalledWith(['SELECT 1 as health_check']);
    });

    it('should return unhealthy status when database fails', async () => {
      const error = new Error('Connection failed');
      mockSql.mockRejectedValue(error);
      
      const health = await checkDbHealth();
      
      expect(health).toEqual({
        status: 'unhealthy',
        connected: false,
        lastCheck: expect.any(String),
        errors: ['Connection failed']
      });
    });

    it('should handle non-Error objects', async () => {
      mockSql.mockRejectedValue('string error');
      
      const health = await checkDbHealth();
      
      expect(health.errors).toEqual(['string error']);
    });
  });

  describe('generateRequestId', () => {
    it('should generate and return request ID', async () => {
      mockSql.mockResolvedValue([{ generate_request_id: 'QR-001' }]);
      
      const requestId = await generateRequestId();
      
      expect(requestId).toBe('QR-001');
      expect(mockSql).toHaveBeenCalledWith(['SELECT generate_request_id()']);
    });

    it('should log the generated request ID', async () => {
      mockSql.mockResolvedValue([{ generate_request_id: 'QR-002' }]);
      
      await generateRequestId();
      
      const { logInfo } = require('../../lib/log');
      expect(logInfo).toHaveBeenCalledWith(
        'Generated new request ID: QR-002',
        { requestId: 'QR-002' }
      );
    });
  });

  describe('validateContactJsonb', () => {
    it('should validate contact and return true for valid contact', async () => {
      const contact = { name: 'John Doe', email: 'john@example.com' };
      mockSql.mockResolvedValue([{ validate_contact_jsonb: true }]);
      
      const isValid = await validateContactJsonb(contact);
      
      expect(isValid).toBe(true);
      expect(mockSql).toHaveBeenCalledWith([`SELECT validate_contact_jsonb(${JSON.stringify(JSON.stringify(contact))})`]);
    });

    it('should return false for invalid contact', async () => {
      const contact = { invalid: 'data' };
      mockSql.mockResolvedValue([{ validate_contact_jsonb: false }]);
      
      const isValid = await validateContactJsonb(contact);
      
      expect(isValid).toBe(false);
    });

    it('should log validation result', async () => {
      const contact = { name: 'John Doe' };
      mockSql.mockResolvedValue([{ validate_contact_jsonb: true }]);
      
      await validateContactJsonb(contact);
      
      const { logInfo } = require('../../lib/log');
      expect(logInfo).toHaveBeenCalledWith(
        'Contact JSONB validation result: true',
        { contact }
      );
    });
  });

  describe('buildWhereClause', () => {
    it('should return empty string for empty conditions', () => {
      const clause = buildWhereClause({});
      expect(clause).toBe('');
    });

    it('should build WHERE clause for simple conditions', () => {
      const conditions: FilterConditions = {
        name: 'John',
        age: 30
      };
      
      const clause = buildWhereClause(conditions);
      
      expect(clause).toBe('WHERE name = "John" AND age = 30');
    });

    it('should handle null values', () => {
      const conditions: FilterConditions = {
        deleted_at: null
      };
      
      const clause = buildWhereClause(conditions);
      
      expect(clause).toBe('WHERE deleted_at IS NULL');
    });

    it('should handle undefined values', () => {
      const conditions: FilterConditions = {
        optional_field: undefined
      };
      
      const clause = buildWhereClause(conditions);
      
      expect(clause).toBe('WHERE optional_field IS NULL');
    });

    it('should handle array values', () => {
      const conditions: FilterConditions = {
        status: ['active', 'pending']
      };
      
      const clause = buildWhereClause(conditions);
      
      expect(clause).toBe('WHERE status = ANY(["active","pending"])');
    });
  });

  describe('buildOrderByClause', () => {
    it('should return default ORDER BY when no options provided', () => {
      const clause = buildOrderByClause({});
      expect(clause).toBe('ORDER BY created_at DESC');
    });

    it('should build ORDER BY with custom field and direction', () => {
      const options: QueryOptions = {
        orderBy: 'name',
        orderDirection: 'ASC'
      };
      
      const clause = buildOrderByClause(options);
      
      expect(clause).toBe('ORDER BY name ASC');
    });

    it('should default to ASC when no direction specified', () => {
      const options: QueryOptions = {
        orderBy: 'email'
      };
      
      const clause = buildOrderByClause(options);
      
      expect(clause).toBe('ORDER BY email ASC');
    });
  });

  describe('buildLimitOffsetClause', () => {
    it('should return default LIMIT and OFFSET', () => {
      const clause = buildLimitOffsetClause({});
      expect(clause).toBe('LIMIT 10 OFFSET 0');
    });

    it('should build LIMIT and OFFSET with custom values', () => {
      const options: QueryOptions = {
        limit: 25,
        offset: 50
      };
      
      const clause = buildLimitOffsetClause(options);
      
      expect(clause).toBe('LIMIT 25 OFFSET 50');
    });
  });

  describe('validateDatabaseConfig', () => {
    it('should return true for valid config', () => {
      const config: DatabaseConfig = {
        url: 'postgresql://test:test@localhost:5432/test',
        environment: 'development'
      };
      
      const isValid = validateDatabaseConfig(config);
      
      expect(isValid).toBe(true);
    });

    it('should throw error when URL is missing', () => {
      const config = {
        environment: 'development'
      } as DatabaseConfig;
      
      expect(() => validateDatabaseConfig(config)).toThrow('Database URL is required');
    });

    it('should throw error when environment is missing', () => {
      const config = {
        url: 'postgresql://test:test@localhost:5432/test'
      } as DatabaseConfig;
      
      expect(() => validateDatabaseConfig(config)).toThrow('Database environment is required');
    });
  });

  describe('getDatabaseConfig', () => {
    it('should return config from environment variables', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.NODE_ENV = 'production';
      process.env.DB_MAX_CONNECTIONS = '20';
      process.env.DB_CONNECTION_TIMEOUT = '60000';
      process.env.DB_QUERY_TIMEOUT = '45000';
      
      const config = getDatabaseConfig();
      
      expect(config).toEqual({
        url: 'postgresql://test:test@localhost:5432/test',
        environment: 'production',
        maxConnections: 20,
        connectionTimeout: 60000,
        queryTimeout: 45000
      });
    });

    it('should use default values when environment variables are not set', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const config = getDatabaseConfig();
      
      expect(config).toEqual({
        url: 'postgresql://test:test@localhost:5432/test',
        environment: 'development',
        maxConnections: 10,
        connectionTimeout: 30000,
        queryTimeout: 30000
      });
    });
  });

  describe('formatQueryForLogging', () => {
    it('should format query without parameters', () => {
      const query = 'SELECT * FROM users';
      
      const formatted = formatQueryForLogging(query);
      
      expect(formatted).toBe('SELECT * FROM users');
    });

    it('should replace parameter placeholders with values', () => {
      const query = 'SELECT * FROM users WHERE id = $1 AND name = $2';
      const params = [123, 'John'];
      
      const formatted = formatQueryForLogging(query, params);
      
      expect(formatted).toBe('SELECT * FROM users WHERE id = 123 AND name = \'John\'');
    });

    it('should truncate long queries', () => {
      const longQuery = 'SELECT * FROM users WHERE ' + 'very_long_condition AND '.repeat(50) + 'id = 1';
      
      const formatted = formatQueryForLogging(longQuery);
      
      expect(formatted.length).toBeLessThanOrEqual(503); // 500 + '...'
      expect(formatted).toEndWith('...');
    });
  });
});
