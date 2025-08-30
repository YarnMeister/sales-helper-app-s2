// Core database types and interfaces

/**
 * Base entity interface for all database entities
 */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database operation result types
 */
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  duration?: number;
}

/**
 * Pagination result interface
 */
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Database query options
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  includeDeleted?: boolean;
}

/**
 * Database filter conditions
 */
export interface FilterConditions {
  [key: string]: any;
}

/**
 * Database sort options
 */
export interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Repository operation context
 */
export interface RepositoryContext {
  tableName: string;
  operation: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Database transaction options
 */
export interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  timeout?: number;
}

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
  environment: 'development' | 'production' | 'test';
}

/**
 * Database health check result
 */
export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  connected: boolean;
  responseTime?: number;
  lastCheck: string;
  errors?: string[];
}

/**
 * Database migration result
 */
export interface MigrationResult {
  success: boolean;
  applied: string[];
  failed: string[];
  errors: string[];
}

/**
 * Database backup result
 */
export interface BackupResult {
  success: boolean;
  backupId?: string;
  size?: number;
  createdAt?: string;
  error?: string;
}

/**
 * Database restore result
 */
export interface RestoreResult {
  success: boolean;
  restoredAt?: string;
  error?: string;
}

/**
 * Database performance metrics
 */
export interface DatabaseMetrics {
  queryCount: number;
  averageResponseTime: number;
  slowQueries: number;
  connectionCount: number;
  timestamp: string;
}

/**
 * Database error types
 */
export enum DatabaseErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  MIGRATION_ERROR = 'MIGRATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR'
}

/**
 * Database error interface
 */
export interface DatabaseError {
  type: DatabaseErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
  context?: RepositoryContext;
}

/**
 * Database operation types
 */
export enum DatabaseOperation {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  TRANSACTION = 'TRANSACTION',
  MIGRATION = 'MIGRATION'
}

/**
 * Database operation log entry
 */
export interface DatabaseOperationLog {
  operation: DatabaseOperation;
  tableName: string;
  recordId?: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}
