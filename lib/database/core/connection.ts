import { createStandardConnection } from '../connection-standard';
import { logInfo, logError } from '../../log';
import { AppError } from '../../errors';

// Database connection instance (lazy-loaded)
let sqlClient: ReturnType<typeof createStandardConnection>['sqlClient'] | null = null;

/**
 * Get the database connection instance
 * Creates a new connection if one doesn't exist
 * Uses standard connection module for consistency
 */
export const getDatabaseConnection = (): ReturnType<typeof createStandardConnection>['sqlClient'] => {
  if (!sqlClient) {
    try {
      const connection = createStandardConnection();
      sqlClient = connection.sqlClient;
      logInfo('Database connection established', {
        context: 'database-connection'
      });
    } catch (error) {
      throw new AppError('Failed to establish database connection', {
        context: 'database-connection',
        originalError: error
      });
    }
  }

  return sqlClient;
};

/**
 * Simple query wrapper with error handling and performance monitoring
 */
export const withDbErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> => {
  try {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    logInfo(`Database operation completed: ${context}`, { 
      duration,
      context 
    });
    
    return result;
  } catch (error) {
    logError(`Database error in ${context}`, { 
      error: error instanceof Error ? error.message : String(error),
      context 
    });
    
    throw new AppError(`Database operation failed: ${context} - ${error instanceof Error ? error.message : String(error)}`, { 
      originalError: error,
      context 
    });
  }
};

/**
 * Test database connectivity
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const connection = getDatabaseConnection();
    await connection`SELECT 1`;
    logInfo('Database connection test successful', {
      context: 'database-connection-test'
    });
    return true;
  } catch (error) {
    logError('Database connection test failed', {
      error: error instanceof Error ? error.message : String(error),
      context: 'database-connection-test'
    });
    return false;
  }
};

/**
 * Get database connection status
 */
export const getConnectionStatus = () => {
  return {
    connected: sqlClient !== null,
    hasDatabaseUrl: !!process.env.DATABASE_URL
  };
};

/**
 * Reset the database connection (force reconnect)
 * Useful after schema changes or migrations
 */
export const resetDatabaseConnection = () => {
  sqlClient = null;
  logInfo('Database connection reset', {
    context: 'database-connection-reset'
  });
};
