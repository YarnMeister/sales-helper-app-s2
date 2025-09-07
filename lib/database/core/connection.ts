import { neon } from '@neondatabase/serverless';
import { logInfo, logError } from '../../log';
import { AppError } from '../../errors';

// Database connection instance
let sql: ReturnType<typeof neon> | null = null;

/**
 * Get the database connection instance
 * Creates a new connection if one doesn't exist
 */
export const getDatabaseConnection = (): ReturnType<typeof neon> => {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new AppError('DATABASE_URL environment variable is required', {
        context: 'database-connection'
      });
    }
    
    sql = neon(databaseUrl);
    logInfo('Database connection established', {
      context: 'database-connection'
    });
  }
  
  return sql;
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
    connected: sql !== null,
    hasDatabaseUrl: !!process.env.DATABASE_URL
  };
};
