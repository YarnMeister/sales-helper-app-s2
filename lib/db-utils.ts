import { sql } from './db';
import { logInfo, logError, withPerformanceLogging } from './log';

/**
 * Get the appropriate table name based on environment
 * Development uses mock tables, production uses real tables
 */
export const getTableName = (baseTableName: string): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const tableName = isDevelopment ? `mock_${baseTableName}` : baseTableName;
  
  logInfo('Table name selected', { 
    environment: process.env.NODE_ENV,
    baseTableName,
    selectedTableName: tableName,
    isMock: isDevelopment
  });
  
  return tableName;
};

/**
 * Get requests table name (requests or mock_requests)
 */
export const getRequestsTableName = (): string => {
  return getTableName('requests');
};

/**
 * Get site visits table name (site_visits or mock_site_visits)
 */
export const getSiteVisitsTableName = (): string => {
  return getTableName('site_visits');
};

export async function dbHealth() {
  return withPerformanceLogging('dbHealth', 'database', async () => {
    const rows = await sql`select 1 as up`;
    return { ok: rows?.[0]?.up === 1 };
  });
}

export async function withTiming<T>(label: string, fn: () => Promise<T>) {
  return withPerformanceLogging(label, 'database', fn);
}

// Generate next sequential request ID using database function
export const generateRequestId = async (): Promise<string> => {
  return withTiming('generateRequestId', async () => {
    const result = await sql`SELECT generate_request_id()`;
    const newId = result[0].generate_request_id;
    logInfo(`Generated new request ID: ${newId}`, { requestId: newId });
    return newId;
  });
};

// Validate contact JSONB using database function
export const validateContactJsonb = async (contact: any): Promise<boolean> => {
  return withTiming('validateContactJsonb', async () => {
    const result = await sql`SELECT validate_contact_jsonb(${JSON.stringify(contact)})`;
    const isValid = result[0].validate_contact_jsonb;
    logInfo(`Contact JSONB validation result: ${isValid}`, { contact });
    return isValid;
  });
};

// Database health check utility
export const checkDbHealth = async (): Promise<{ 
  healthy: boolean; 
  environment: string; 
  latency?: number;
  version?: string;
}> => {
  return withTiming('checkDbHealth', async () => {
    const result = await sql`SELECT 1 as health_check`;
    
    return { 
      healthy: true, 
      environment: process.env.NODE_ENV || 'development',
      version: 'PostgreSQL (Neon Serverless)'
    };
  });
};
