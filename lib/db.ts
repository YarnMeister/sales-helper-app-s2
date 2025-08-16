import { neon, neonConfig } from '@neondatabase/serverless';

// Optional: improve local debugging
neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export const sql = neon(process.env.DATABASE_URL);
