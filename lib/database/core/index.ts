// Core database infrastructure exports

// Connection management
export {
  getDatabaseConnection,
  withDbErrorHandling,
  testDatabaseConnection,
  getConnectionStatus
} from './connection';

// Base repository pattern
export { BaseRepository } from './repository';
export type { BaseRepositoryInterface } from './repository';

// Core database types
export * from './types';

// Database utilities
export {
  getTableName,
  getRequestsTableName,
  getSiteVisitsTableName,
  checkDbHealth,
  generateRequestId,
  validateContactJsonb,
  buildWhereClause,
  buildOrderByClause,
  buildLimitOffsetClause,
  executeQuery,
  executeSingleQuery,
  executeCountQuery,
  validateDatabaseConfig,
  getDatabaseConfig,
  formatQueryForLogging
} from './utils';
