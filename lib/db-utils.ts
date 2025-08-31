import { sql } from './db';
import { logInfo, logError, withPerformanceLogging } from './log';

/**
 * Get the appropriate table name - now always uses production table names
 * No more environment-based table selection since we have true database separation
 */
export const getTableName = (baseTableName: string): string => {
  // Always use production table names since we have separate databases
  logInfo('Table name selected', { 
    environment: process.env.NODE_ENV,
    baseTableName,
    selectedTableName: baseTableName,
    isMock: false
  });
  
  return baseTableName;
};

/**
 * Get requests table name (always 'requests')
 */
export const getRequestsTableName = (): string => {
  return getTableName('requests');
};

/**
 * Get site visits table name (always 'site_visits')
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

// Generate next sequential request ID using client-side localStorage (offline-first)
export const generateRequestId = async (): Promise<string> => {
  return withTiming('generateRequestId', async () => {
    // Environment-specific localStorage keys
    const getQRCounterKey = (): string => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      return isDevelopment ? 'qr_counter_dev' : 'qr_counter_prod';
    };

    // Generates sequential IDs: QR-002, QR-003, QR-004, etc.
    const generateQRId = (): string => {
      const counterKey = getQRCounterKey();
      const currentCounter = localStorage.getItem(counterKey);
      const nextCounter = currentCounter ? parseInt(currentCounter, 10) + 1 : 2;
      localStorage.setItem(counterKey, nextCounter.toString());
      return `QR-${nextCounter.toString().padStart(3, '0')}`;
    };

    const newId = generateQRId();
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
