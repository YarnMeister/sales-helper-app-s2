import { describe, it, expect } from 'vitest';
import {
  BaseEntity,
  DatabaseResult,
  PaginationResult,
  QueryOptions,
  FilterConditions,
  SortOptions,
  RepositoryContext,
  TransactionOptions,
  DatabaseConfig,
  DatabaseHealth,
  MigrationResult,
  BackupResult,
  RestoreResult,
  DatabaseMetrics,
  DatabaseErrorType,
  DatabaseError,
  DatabaseOperation,
  DatabaseOperationLog
} from '../../lib/database/core/types';

describe('Database Core Types', () => {
  describe('BaseEntity', () => {
    it('should have required fields', () => {
      const entity: BaseEntity = {
        id: 'test-id',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      expect(entity.id).toBe('test-id');
      expect(entity.created_at).toBe('2023-01-01T00:00:00Z');
      expect(entity.updated_at).toBe('2023-01-01T00:00:00Z');
    });
  });

  describe('DatabaseResult', () => {
    it('should handle successful result', () => {
      const result: DatabaseResult<string> = {
        success: true,
        data: 'test-data',
        duration: 100
      };

      expect(result.success).toBe(true);
      expect(result.data).toBe('test-data');
      expect(result.duration).toBe(100);
      expect(result.error).toBeUndefined();
    });

    it('should handle error result', () => {
      const result: DatabaseResult<string> = {
        success: false,
        error: 'Database connection failed'
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
      expect(result.data).toBeUndefined();
    });
  });

  describe('PaginationResult', () => {
    it('should calculate pagination properties correctly', () => {
      const result: PaginationResult<string> = {
        data: ['item1', 'item2', 'item3'],
        total: 100,
        page: 2,
        limit: 10,
        totalPages: 10,
        hasNext: true,
        hasPrev: true
      };

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(100);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(10);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it('should handle first page', () => {
      const result: PaginationResult<string> = {
        data: ['item1'],
        total: 50,
        page: 1,
        limit: 10,
        totalPages: 5,
        hasNext: true,
        hasPrev: false
      };

      expect(result.page).toBe(1);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('should handle last page', () => {
      const result: PaginationResult<string> = {
        data: ['item1'],
        total: 50,
        page: 5,
        limit: 10,
        totalPages: 5,
        hasNext: false,
        hasPrev: true
      };

      expect(result.page).toBe(5);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });
  });

  describe('QueryOptions', () => {
    it('should have optional properties', () => {
      const options: QueryOptions = {
        limit: 25,
        offset: 50,
        orderBy: 'created_at',
        orderDirection: 'DESC',
        includeDeleted: false
      };

      expect(options.limit).toBe(25);
      expect(options.offset).toBe(50);
      expect(options.orderBy).toBe('created_at');
      expect(options.orderDirection).toBe('DESC');
      expect(options.includeDeleted).toBe(false);
    });

    it('should work with minimal options', () => {
      const options: QueryOptions = {};

      expect(options.limit).toBeUndefined();
      expect(options.offset).toBeUndefined();
      expect(options.orderBy).toBeUndefined();
      expect(options.orderDirection).toBeUndefined();
      expect(options.includeDeleted).toBeUndefined();
    });
  });

  describe('FilterConditions', () => {
    it('should accept any key-value pairs', () => {
      const conditions: FilterConditions = {
        name: 'John',
        age: 30,
        active: true,
        tags: ['admin', 'user'],
        metadata: { role: 'admin' }
      };

      expect(conditions.name).toBe('John');
      expect(conditions.age).toBe(30);
      expect(conditions.active).toBe(true);
      expect(conditions.tags).toEqual(['admin', 'user']);
      expect(conditions.metadata).toEqual({ role: 'admin' });
    });
  });

  describe('SortOptions', () => {
    it('should define sort field and direction', () => {
      const sortAsc: SortOptions = {
        field: 'name',
        direction: 'ASC'
      };

      const sortDesc: SortOptions = {
        field: 'created_at',
        direction: 'DESC'
      };

      expect(sortAsc.field).toBe('name');
      expect(sortAsc.direction).toBe('ASC');
      expect(sortDesc.field).toBe('created_at');
      expect(sortDesc.direction).toBe('DESC');
    });
  });

  describe('RepositoryContext', () => {
    it('should have required and optional properties', () => {
      const context: RepositoryContext = {
        tableName: 'users',
        operation: 'CREATE',
        userId: 'user-123',
        sessionId: 'session-456'
      };

      expect(context.tableName).toBe('users');
      expect(context.operation).toBe('CREATE');
      expect(context.userId).toBe('user-123');
      expect(context.sessionId).toBe('session-456');
    });

    it('should work with minimal context', () => {
      const context: RepositoryContext = {
        tableName: 'products',
        operation: 'READ'
      };

      expect(context.tableName).toBe('products');
      expect(context.operation).toBe('READ');
      expect(context.userId).toBeUndefined();
      expect(context.sessionId).toBeUndefined();
    });
  });

  describe('TransactionOptions', () => {
    it('should define transaction isolation levels', () => {
      const options: TransactionOptions = {
        isolationLevel: 'READ COMMITTED',
        timeout: 30000
      };

      expect(options.isolationLevel).toBe('READ COMMITTED');
      expect(options.timeout).toBe(30000);
    });

    it('should work with default options', () => {
      const options: TransactionOptions = {};

      expect(options.isolationLevel).toBeUndefined();
      expect(options.timeout).toBeUndefined();
    });
  });

  describe('DatabaseConfig', () => {
    it('should have required and optional properties', () => {
      const config: DatabaseConfig = {
        url: 'postgresql://test:test@localhost:5432/test',
        maxConnections: 20,
        connectionTimeout: 30000,
        queryTimeout: 60000,
        environment: 'production'
      };

      expect(config.url).toBe('postgresql://test:test@localhost:5432/test');
      expect(config.maxConnections).toBe(20);
      expect(config.connectionTimeout).toBe(30000);
      expect(config.queryTimeout).toBe(60000);
      expect(config.environment).toBe('production');
    });

    it('should work with minimal config', () => {
      const config: DatabaseConfig = {
        url: 'postgresql://test:test@localhost:5432/test',
        environment: 'development'
      };

      expect(config.url).toBe('postgresql://test:test@localhost:5432/test');
      expect(config.environment).toBe('development');
      expect(config.maxConnections).toBeUndefined();
    });
  });

  describe('DatabaseHealth', () => {
    it('should represent healthy database state', () => {
      const health: DatabaseHealth = {
        status: 'healthy',
        connected: true,
        responseTime: 50,
        lastCheck: '2023-01-01T00:00:00Z'
      };

      expect(health.status).toBe('healthy');
      expect(health.connected).toBe(true);
      expect(health.responseTime).toBe(50);
      expect(health.lastCheck).toBe('2023-01-01T00:00:00Z');
      expect(health.errors).toBeUndefined();
    });

    it('should represent unhealthy database state', () => {
      const health: DatabaseHealth = {
        status: 'unhealthy',
        connected: false,
        lastCheck: '2023-01-01T00:00:00Z',
        errors: ['Connection timeout', 'Authentication failed']
      };

      expect(health.status).toBe('unhealthy');
      expect(health.connected).toBe(false);
      expect(health.errors).toEqual(['Connection timeout', 'Authentication failed']);
    });
  });

  describe('DatabaseErrorType', () => {
    it('should have all error types', () => {
      expect(DatabaseErrorType.CONNECTION_ERROR).toBe('CONNECTION_ERROR');
      expect(DatabaseErrorType.QUERY_ERROR).toBe('QUERY_ERROR');
      expect(DatabaseErrorType.TRANSACTION_ERROR).toBe('TRANSACTION_ERROR');
      expect(DatabaseErrorType.MIGRATION_ERROR).toBe('MIGRATION_ERROR');
      expect(DatabaseErrorType.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(DatabaseErrorType.PERMISSION_ERROR).toBe('PERMISSION_ERROR');
    });
  });

  describe('DatabaseError', () => {
    it('should represent database error with context', () => {
      const error: DatabaseError = {
        type: DatabaseErrorType.CONNECTION_ERROR,
        message: 'Failed to connect to database',
        code: 'ECONNREFUSED',
        details: { host: 'localhost', port: 5432 },
        timestamp: '2023-01-01T00:00:00Z',
        context: {
          tableName: 'users',
          operation: 'CREATE'
        }
      };

      expect(error.type).toBe(DatabaseErrorType.CONNECTION_ERROR);
      expect(error.message).toBe('Failed to connect to database');
      expect(error.code).toBe('ECONNREFUSED');
      expect(error.details).toEqual({ host: 'localhost', port: 5432 });
      expect(error.context?.tableName).toBe('users');
    });
  });

  describe('DatabaseOperation', () => {
    it('should have all operation types', () => {
      expect(DatabaseOperation.CREATE).toBe('CREATE');
      expect(DatabaseOperation.READ).toBe('READ');
      expect(DatabaseOperation.UPDATE).toBe('UPDATE');
      expect(DatabaseOperation.DELETE).toBe('DELETE');
      expect(DatabaseOperation.TRANSACTION).toBe('TRANSACTION');
      expect(DatabaseOperation.MIGRATION).toBe('MIGRATION');
    });
  });

  describe('DatabaseOperationLog', () => {
    it('should log database operations', () => {
      const log: DatabaseOperationLog = {
        operation: DatabaseOperation.CREATE,
        tableName: 'users',
        recordId: 'user-123',
        duration: 150,
        success: true,
        timestamp: '2023-01-01T00:00:00Z',
        userId: 'admin-456',
        sessionId: 'session-789'
      };

      expect(log.operation).toBe(DatabaseOperation.CREATE);
      expect(log.tableName).toBe('users');
      expect(log.recordId).toBe('user-123');
      expect(log.duration).toBe(150);
      expect(log.success).toBe(true);
      expect(log.userId).toBe('admin-456');
      expect(log.sessionId).toBe('session-789');
    });

    it('should log failed operations', () => {
      const log: DatabaseOperationLog = {
        operation: DatabaseOperation.UPDATE,
        tableName: 'products',
        duration: 75,
        success: false,
        error: 'Constraint violation',
        timestamp: '2023-01-01T00:00:00Z'
      };

      expect(log.success).toBe(false);
      expect(log.error).toBe('Constraint violation');
      expect(log.recordId).toBeUndefined();
    });
  });
});
