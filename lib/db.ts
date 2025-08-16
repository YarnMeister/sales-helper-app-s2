import { Pool, PoolClient } from 'pg';
import { getDatabaseConfig } from './env';
import { AppError } from './errors';

// Create environment-aware database client
export const getDb = () => {
  const config = getDatabaseConfig();
  
  console.log(`Creating PostgreSQL client for ${config.environment} environment`, {
    url: config.url,
    environment: config.environment
  });
  
  return new Pool({
    connectionString: config.url,
    ssl: config.environment === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
};

// Utility for consistent error handling in database operations
export const withDbErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> => {
  try {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    console.log(`Database operation completed: ${context}`, { 
      duration: `${duration}ms`,
      context 
    });
    
    return result;
  } catch (error) {
    console.error(`Database error in ${context}`, { 
      error: error instanceof Error ? error.message : String(error),
      context 
    });
    
    if (error instanceof Error) {
      throw new AppError(`Database operation failed: ${context} - ${error.message}`, { 
        originalError: error,
        context 
      });
    }
    
    throw new AppError(`Database operation failed: ${context}`, { 
      originalError: error,
      context 
    });
  }
};

// Generate next sequential request ID using database function
export const generateRequestId = async (): Promise<string> => {
  return withDbErrorHandling(async () => {
    const db = getDb();
    const client = await db.connect();
    
    try {
      const result = await client.query('SELECT generate_request_id()');
      const newId = result.rows[0].generate_request_id;
      
      console.log(`Generated new request ID: ${newId}`);
      
      return newId;
    } finally {
      client.release();
    }
  }, 'generateRequestId');
};

// Validate contact JSONB using database function
export const validateContactJsonb = async (contact: any): Promise<boolean> => {
  return withDbErrorHandling(async () => {
    const db = getDb();
    const client = await db.connect();
    
    try {
      const result = await client.query(
        'SELECT validate_contact_jsonb($1)',
        [JSON.stringify(contact)]
      );
      
      const isValid = result.rows[0].validate_contact_jsonb;
      
      console.log(`Contact JSONB validation result: ${isValid}`, { contact });
      
      return isValid;
    } finally {
      client.release();
    }
  }, 'validateContactJsonb');
};

// Database health check utility
export const checkDbHealth = async (): Promise<{ 
  healthy: boolean; 
  environment: string; 
  latency?: number;
  version?: string;
}> => {
  return withDbErrorHandling(async () => {
    const startTime = Date.now();
    const db = getDb();
    const client = await db.connect();
    const config = getDatabaseConfig();
    
    try {
      // Simple query to check connectivity
      const result = await client.query('SELECT 1 as health_check');
      const latency = Date.now() - startTime;
      
      console.log(`Database health check passed`, { 
        latency: `${latency}ms`,
        environment: config.environment 
      });
      
      return { 
        healthy: true, 
        environment: config.environment,
        latency,
        version: 'PostgreSQL (Neon)'
      };
    } finally {
      client.release();
    }
  }, 'checkDbHealth');
};

// KV cache utilities for better performance
export const kvGet = async <T = any>(key: string): Promise<T | null> => {
  return withDbErrorHandling(async () => {
    const db = getDb();
    const client = await db.connect();
    
    try {
      const result = await client.query(
        'SELECT value FROM kv_cache WHERE key = $1',
        [key]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0].value as T;
    } finally {
      client.release();
    }
  }, `kvGet:${key}`);
};

export const kvSet = async (key: string, value: any): Promise<void> => {
  return withDbErrorHandling(async () => {
    const db = getDb();
    const client = await db.connect();
    
    try {
      await client.query(
        `INSERT INTO kv_cache (key, value, updated_at) 
         VALUES ($1, $2, now()) 
         ON CONFLICT (key) 
         DO UPDATE SET value = $2, updated_at = now()`,
        [key, JSON.stringify(value)]
      );
      
      console.log(`KV cache updated`, { key });
    } finally {
      client.release();
    }
  }, `kvSet:${key}`);
};

// Enhanced query function for database-utils.ts compatibility
export const query = async <T = any>(
  text: string, 
  params: any[] = []
): Promise<{ rows: T[]; rowCount: number }> => {
  return withDbErrorHandling(async () => {
    const db = getDb();
    const client = await db.connect();
    
    try {
      const result = await client.query(text, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0
      };
    } finally {
      client.release();
    }
  }, `query:${text.substring(0, 50)}...`);
};
