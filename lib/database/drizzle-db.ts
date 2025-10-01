import { createStandardConnection } from './connection-standard';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Use standard connection module for consistency
const { sqlClient, db: dbInstance } = createStandardConnection();

// Create Drizzle instance with schema
export const db = drizzle(sqlClient, { schema });

// Export the raw sql client for complex queries
export const sql = sqlClient;
