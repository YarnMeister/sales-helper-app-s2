import { sql } from './db';

export async function dbHealth() {
  // returns { ok: true } when DB is reachable
  const rows = await sql`select 1 as up`;
  return { ok: rows?.[0]?.up === 1 };
}

export async function withTiming<T>(label: string, fn: () => Promise<T>) {
  const t0 = Date.now();
  try {
    const result = await fn();
    console.log(JSON.stringify({ event: 'db.query', label, durationMs: Date.now() - t0, severity: 'info' }));
    return result;
  } catch (err: any) {
    console.error(JSON.stringify({ event: 'db.query.error', label, durationMs: Date.now() - t0, severity: 'error', message: err?.message }));
    throw err;
  }
}

// Generate next sequential request ID using database function
export const generateRequestId = async (): Promise<string> => {
  return withTiming('generateRequestId', async () => {
    const result = await sql`SELECT generate_request_id()`;
    const newId = result[0].generate_request_id;
    console.log(`Generated new request ID: ${newId}`);
    return newId;
  });
};

// Validate contact JSONB using database function
export const validateContactJsonb = async (contact: any): Promise<boolean> => {
  return withTiming('validateContactJsonb', async () => {
    const result = await sql`SELECT validate_contact_jsonb(${JSON.stringify(contact)})`;
    const isValid = result[0].validate_contact_jsonb;
    console.log(`Contact JSONB validation result: ${isValid}`, { contact });
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
    const startTime = Date.now();
    const result = await sql`SELECT 1 as health_check`;
    const latency = Date.now() - startTime;
    
    console.log(`Database health check passed`, { 
      latency: `${latency}ms`,
      environment: process.env.NODE_ENV || 'development'
    });
    
    return { 
      healthy: true, 
      environment: process.env.NODE_ENV || 'development',
      latency,
      version: 'PostgreSQL (Neon Serverless)'
    };
  });
};
