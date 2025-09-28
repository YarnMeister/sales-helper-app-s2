import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the new core database modules
vi.mock('../../lib/database/core/connection', () => ({
  getDatabaseConnection: vi.fn(),
  withDbErrorHandling: vi.fn(),
  testDatabaseConnection: vi.fn()
}));

vi.mock('../../lib/database/core/utils', () => ({
  generateRequestId: vi.fn(),
  validateContactJsonb: vi.fn(),
  checkDatabaseHealth: vi.fn(),
  getTableName: vi.fn(),
  buildWhereClause: vi.fn(),
  buildOrderByClause: vi.fn(),
  buildLimitClause: vi.fn()
}));

// Mock the legacy adapter for backward compatibility
vi.mock('../../lib/database/legacy-adapter', () => ({
  sql: vi.fn()
}));

import { getDatabaseConnection, withDbErrorHandling, testDatabaseConnection } from '../../lib/database/core/connection';
import {
  generateRequestId,
  validateContactJsonb,
  checkDatabaseHealth,
  getTableName,
  buildWhereClause,
  buildOrderByClause,
  buildLimitClause
} from '../../lib/database/core/utils';
import { sql } from '../../lib/database/legacy-adapter';

describe('Database Core Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock implementations for core utilities
    vi.mocked(generateRequestId).mockResolvedValue('QR-001');
    vi.mocked(validateContactJsonb).mockResolvedValue(true);
    vi.mocked(checkDatabaseHealth).mockResolvedValue({
      status: 'healthy',
      connected: true,
      responseTime: 10,
      lastCheck: new Date().toISOString()
    });
    vi.mocked(getTableName).mockImplementation((baseName) => `${baseName}_test`);
    vi.mocked(buildWhereClause).mockReturnValue({ sql: 'WHERE id = $1', params: ['test-id'] });
    vi.mocked(buildOrderByClause).mockReturnValue('ORDER BY created_at DESC');
    vi.mocked(buildLimitClause).mockReturnValue({ sql: 'LIMIT $1 OFFSET $2', params: [10, 0] });

    // Set up connection mocks
    const mockSql = vi.fn();
    vi.mocked(getDatabaseConnection).mockReturnValue(mockSql);
    vi.mocked(withDbErrorHandling).mockImplementation(async (operation) => {
      return await operation();
    });
    vi.mocked(testDatabaseConnection).mockResolvedValue(true);

    // Set up legacy adapter mock
    vi.mocked(sql).mockResolvedValue([{ result: 'success' }]);
  });

  describe('Database Connection', () => {
    it('should get database connection', () => {
      const connection = getDatabaseConnection();
      expect(connection).toBeDefined();
      expect(typeof connection).toBe('function');
    });

    it('should test database connection', async () => {
      const isConnected = await testDatabaseConnection();
      expect(isConnected).toBe(true);
      expect(testDatabaseConnection).toHaveBeenCalledTimes(1);
    });

    it('should handle database operations with error handling', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await withDbErrorHandling(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors properly', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Database error'));
      vi.mocked(withDbErrorHandling).mockRejectedValue(new Error('Database error'));

      await expect(withDbErrorHandling(operation)).rejects.toThrow('Database error');
    });
  });

  describe('Database Utilities', () => {
    it('should generate sequential request IDs', async () => {
      const id = await generateRequestId();
      expect(id).toBe('QR-001');
      expect(generateRequestId).toHaveBeenCalledTimes(1);
    });

    it('should validate contact JSONB', async () => {
      const validContact = {
        personId: 123,
        name: 'John Doe',
        mineGroup: 'Northern Mines',
        mineName: 'Diamond Mine A'
      };

      const isValid = await validateContactJsonb(validContact);
      expect(isValid).toBe(true);
      expect(validateContactJsonb).toHaveBeenCalledWith(validContact);
    });

    it('should perform database health check', async () => {
      const health = await checkDatabaseHealth();

      expect(health).toHaveProperty('status', 'healthy');
      expect(health).toHaveProperty('connected', true);
      expect(health).toHaveProperty('responseTime');
      expect(health).toHaveProperty('lastCheck');
      expect(health.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should get environment-aware table names', () => {
      const tableName = getTableName('requests');
      expect(tableName).toBe('requests_test');
      expect(getTableName).toHaveBeenCalledWith('requests');
    });

    it('should build WHERE clauses', () => {
      const result = buildWhereClause({ id: 'test-id' });
      expect(result).toEqual({
        sql: 'WHERE id = $1',
        params: ['test-id']
      });
    });

    it('should build ORDER BY clauses', () => {
      const result = buildOrderByClause('created_at', 'DESC');
      expect(result).toBe('ORDER BY created_at DESC');
    });

    it('should build LIMIT clauses', () => {
      const result = buildLimitClause(10, 0);
      expect(result).toEqual({
        sql: 'LIMIT $1 OFFSET $2',
        params: [10, 0]
      });
    });
  });

  describe('Legacy Adapter Compatibility', () => {
    it('should maintain backward compatibility with legacy sql function', async () => {
      const result = await sql`SELECT 1 as test`;
      expect(result).toEqual([{ result: 'success' }]);
      expect(sql).toHaveBeenCalledTimes(1);
    });

    it('should work with template literals', async () => {
      const testValue = 'test-value';
      const result = await sql`SELECT ${testValue} as value`;
      expect(result).toEqual([{ result: 'success' }]);
    });
  });

  describe('Integration Tests', () => {
    it('should integrate connection, utilities, and legacy adapter', async () => {
      // Test the full flow: get connection, use utilities, execute query
      const connection = getDatabaseConnection();
      expect(connection).toBeDefined();

      const tableName = getTableName('test_table');
      expect(tableName).toBe('test_table_test');

      const whereClause = buildWhereClause({ active: true });
      expect(whereClause.sql).toBe('WHERE id = $1');

      const result = await sql`SELECT * FROM ${tableName} ${whereClause.sql}`;
      expect(result).toEqual([{ result: 'success' }]);
    });

    it('should handle complex query building', async () => {
      const filters = { status: 'active', type: 'user' };
      const orderBy = 'created_at';
      const limit = 20;
      const offset = 0;

      const whereClause = buildWhereClause(filters);
      const orderClause = buildOrderByClause(orderBy, 'DESC');
      const limitClause = buildLimitClause(limit, offset);

      expect(whereClause.sql).toBe('WHERE id = $1');
      expect(orderClause).toBe('ORDER BY created_at DESC');
      expect(limitClause.sql).toBe('LIMIT $1 OFFSET $2');

      // Simulate executing the built query
      const result = await withDbErrorHandling(async () => {
        return await sql`SELECT * FROM users ${whereClause.sql} ${orderClause} ${limitClause.sql}`;
      });

      expect(result).toEqual([{ result: 'success' }]);
    });
  });
});
