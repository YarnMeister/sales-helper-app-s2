import { Pool, PoolClient } from 'pg';
import { getDatabaseConfig } from './env';

// Create connection pool
let pool: Pool | null = null;

export const getDbPool = (): Pool => {
  if (!pool) {
    const config = getDatabaseConfig();
    
    pool = new Pool({
      connectionString: config.url,
      ssl: config.url.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Database pool error', { error: err.message });
    });
    
    console.log(`Database pool created for ${config.environment} environment`);
  }
  
  return pool;
};

// Get a client from the pool
export const getDbClient = async (): Promise<PoolClient> => {
  const pool = getDbPool();
  return await pool.connect();
};

// Execute a query with automatic connection management
export const query = async <T = any>(
  text: string, 
  params: any[] = []
): Promise<{ rows: T[]; rowCount: number }> => {
  const client = await getDbClient();
  
  try {
    const startTime = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - startTime;
    
    console.log(`Query executed`, { 
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rowCount: result.rowCount 
    });
    
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0
    };
  } finally {
    client.release();
  }
};

// Database health check utility
export const checkDbHealth = async (): Promise<{ 
  healthy: boolean; 
  environment: string; 
  latency?: number;
  version?: string;
}> => {
  try {
    const startTime = Date.now();
    const config = getDatabaseConfig();
    
    // Check connection and get database version
    const result = await query('SELECT version() as version, now() as timestamp');
    const latency = Date.now() - startTime;
    
    const version = result.rows[0]?.version?.split(' ')[1] || 'Unknown';
    
    console.log(`Database health check passed`, { 
      latency: `${latency}ms`,
      environment: config.environment,
      version
    });
    
    return { 
      healthy: true, 
      environment: config.environment,
      latency,
      version
    };
  } catch (error) {
    console.error('Database health check failed', { error: (error as Error).message });
    return { 
      healthy: false, 
      environment: 'unknown'
    };
  }
};

// Graceful shutdown
export const closeDbPool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
};

// Export for Next.js API routes cleanup
process.on('SIGTERM', closeDbPool);
process.on('SIGINT', closeDbPool);
