import { createStandardConnection } from './connection-standard';
import { logInfo, logError } from '../log';

// Use standard connection module for consistency
const { sqlClient, db: dbInstance } = createStandardConnection();

// Export Drizzle instance
export const db = dbInstance;

// Export raw SQL client for backward compatibility
export const sql = sqlClient;

// Simple query wrapper with error handling (maintaining compatibility)
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

    throw error;
  }
};
