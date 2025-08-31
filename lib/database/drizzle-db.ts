import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Use unpooled connection for migrations to avoid pgbouncer limitations
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED not set');
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

// Export the raw sql client for complex queries
export { sql };
