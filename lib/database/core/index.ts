/**
 * Database Core Module Index
 * 
 * Main entry point for the database core module in the modular architecture.
 * Exports all core components and utilities.
 */

// Core repository interfaces and implementations
export * from './base-repository';
export * from './repository-factory';

// Re-export shared types
export * from '../../types/shared/repository';

// Database utilities and helpers
export * from '../db-utils';
export * from '../database';
export * from '../schema';

// Configuration and environment
export * from '../config/database-config';

// Error handling
export * from '../errors';

// Logging
export * from '../log';

// Convenience exports for common operations
export {
  getRepository,
  registerRepository,
  initializeRepositoryFactory,
  getRepositoryFactory,
  resetRepositoryFactory
} from './repository-factory';

// Type exports for common use cases
export type {
  BaseRepository,
  RepositoryFactory,
  RepositoryConfig,
  BaseRepositoryImpl
} from './base-repository';

export type {
  BaseEntity,
  PaginationResult,
  EntityFilter,
  SortOptions,
  QueryOptions,
  RepositoryResult,
  RepositoryError,
  RepositoryOptions
} from '../../types/shared/repository';
