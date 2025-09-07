import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { logInfo, logError } from '../log';

// Get Neon connection
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle instance
export const db = drizzle(sql);

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

// Export raw SQL for backward compatibility
export { sql };
