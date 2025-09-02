/**
 * Shared Repository Types
 * 
 * Common types and interfaces used across the repository pattern implementation.
 * These types ensure consistency and type safety throughout the modular architecture.
 */

import { BaseRepository } from '../../lib/database/core/base-repository';

/**
 * Generic entity interface that all entities should implement
 */
export interface BaseEntity {
  id: string | number;
  createdAt?: Date;
  updatedAt?: Date;
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
 * Filter interface for querying entities
 */
export interface EntityFilter<T = any> {
  [key: string]: any;
}

/**
 * Sort options for querying entities
 */
export interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Query options for repository operations
 */
export interface QueryOptions<T = any> {
  filters?: EntityFilter<T>;
  sort?: SortOptions;
  page?: number;
  limit?: number;
  include?: string[];
  select?: (keyof T)[];
}

/**
 * Create operation result
 */
export interface CreateResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Update operation result
 */
export interface UpdateResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  updated: boolean;
}

/**
 * Delete operation result
 */
export interface DeleteResult {
  success: boolean;
  deleted: boolean;
  error?: string;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors?: string[];
}

/**
 * Repository operation metadata
 */
export interface OperationMetadata {
  timestamp: Date;
  operation: string;
  entity: string;
  userId?: string;
  sessionId?: string;
  duration?: number;
}

/**
 * Repository performance metrics
 */
export interface RepositoryMetrics {
  totalOperations: number;
  averageResponseTime: number;
  slowestOperation: {
    operation: string;
    duration: number;
    timestamp: Date;
  };
  errorRate: number;
  lastUpdated: Date;
}

/**
 * Repository health status
 */
export interface RepositoryHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  warnings: string[];
}

/**
 * Repository configuration options
 */
export interface RepositoryOptions {
  enableCaching?: boolean;
  cacheTTL?: number;
  enableAuditing?: boolean;
  enableMetrics?: boolean;
  retryAttempts?: number;
  timeout?: number;
}

/**
 * Repository event types
 */
export type RepositoryEventType = 
  | 'entity_created'
  | 'entity_updated'
  | 'entity_deleted'
  | 'bulk_operation_started'
  | 'bulk_operation_completed'
  | 'operation_failed'
  | 'cache_hit'
  | 'cache_miss';

/**
 * Repository event interface
 */
export interface RepositoryEvent<T = any> {
  type: RepositoryEventType;
  entity: string;
  entityId?: string | number;
  data?: T;
  metadata: OperationMetadata;
  timestamp: Date;
}

/**
 * Repository event handler interface
 */
export interface RepositoryEventHandler<T = any> {
  (event: RepositoryEvent<T>): void | Promise<void>;
}

/**
 * Repository event emitter interface
 */
export interface RepositoryEventEmitter {
  on<T>(eventType: RepositoryEventType, handler: RepositoryEventHandler<T>): void;
  off<T>(eventType: RepositoryEventType, handler: RepositoryEventHandler<T>): void;
  emit<T>(event: RepositoryEvent<T>): void;
}

/**
 * Repository transaction interface
 */
export interface RepositoryTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

/**
 * Repository transaction manager interface
 */
export interface TransactionManager {
  beginTransaction(): Promise<RepositoryTransaction>;
  executeInTransaction<T>(
    operation: (transaction: RepositoryTransaction) => Promise<T>
  ): Promise<T>;
}

/**
 * Repository cache interface
 */
export interface RepositoryCache<T = any> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * Repository audit log entry
 */
export interface AuditLogEntry<T = any> {
  id: string;
  timestamp: Date;
  operation: string;
  entity: string;
  entityId?: string | number;
  userId?: string;
  sessionId?: string;
  oldData?: T;
  newData?: T;
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Repository validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

/**
 * Repository validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Repository constraint violation
 */
export interface ConstraintViolation {
  constraint: string;
  table: string;
  column?: string;
  message: string;
}

/**
 * Repository error types
 */
export type RepositoryErrorType = 
  | 'validation_error'
  | 'constraint_violation'
  | 'not_found'
  | 'duplicate_key'
  | 'connection_error'
  | 'timeout_error'
  | 'permission_error'
  | 'unknown_error';

/**
 * Repository error interface
 */
export interface RepositoryError extends Error {
  type: RepositoryErrorType;
  code?: string;
  details?: any;
  constraintViolations?: ConstraintViolation[];
  validationErrors?: ValidationError[];
}

/**
 * Repository result wrapper
 * 
 * Wraps repository operation results with additional metadata and error handling
 */
export class RepositoryResult<T> {
  constructor(
    public readonly success: boolean,
    public readonly data?: T,
    public readonly error?: RepositoryError,
    public readonly metadata?: OperationMetadata
  ) {}

  /**
   * Create a successful result
   */
  static success<T>(data: T, metadata?: OperationMetadata): RepositoryResult<T> {
    return new RepositoryResult(true, data, undefined, metadata);
  }

  /**
   * Create an error result
   */
  static error<T>(error: RepositoryError, metadata?: OperationMetadata): RepositoryResult<T> {
    return new RepositoryResult(false, undefined, error, metadata);
  }

  /**
   * Check if the result is successful
   */
  isSuccess(): boolean {
    return this.success;
  }

  /**
   * Check if the result has an error
   */
  hasError(): boolean {
    return !this.success && !!this.error;
  }

  /**
   * Get the data or throw an error if unsuccessful
   */
  getData(): T {
    if (!this.success || !this.data) {
      throw this.error || new Error('No data available');
    }
    return this.data;
  }

  /**
   * Get the error if the result is unsuccessful
   */
  getError(): RepositoryError | undefined {
    return this.error;
  }

  /**
   * Map the data if successful, otherwise return error result
   */
  map<U>(mapper: (data: T) => U): RepositoryResult<U> {
    if (!this.success) {
      return RepositoryResult.error<U>(this.error!, this.metadata);
    }
    return RepositoryResult.success(mapper(this.data!), this.metadata);
  }

  /**
   * Chain another operation if successful
   */
  chain<U>(operation: (data: T) => Promise<RepositoryResult<U>>): Promise<RepositoryResult<U>> {
    if (!this.success) {
      return Promise.resolve(RepositoryResult.error<U>(this.error!, this.metadata));
    }
    return operation(this.data!);
  }
}
