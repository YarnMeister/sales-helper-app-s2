/**
 * Database Connection Standard
 *
 * This module enforces consistent database connections across the entire application.
 * ALL database operations must use this module to prevent connection method splits.
 *
 * IMPORTANT: Uses HTTP driver (neon) for raw SQL queries (stateless, no caching)
 * Uses WebSocket driver (Pool) only for Drizzle ORM operations
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { config } from 'dotenv';
import { resolve } from 'path';
import ws from 'ws';

// Configure WebSocket for Node.js environment (for Pool)
neonConfig.webSocketConstructor = ws;

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

/**
 * Standard database connection configuration
 */
const CONNECTION_CONFIG = {
  // Use HTTP driver for raw SQL (stateless, no caching issues)
  driver: 'neon-http' as const,

  // Connection string priority
  url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,

  // Connection options
  options: {
    // Add any standard connection options here
  }
};

/**
 * Validate connection configuration
 */
function validateConnection() {
  if (!CONNECTION_CONFIG.url) {
    throw new Error(
      '❌ Database connection not configured. ' +
      'Set DATABASE_URL or DATABASE_URL_UNPOOLED environment variable.'
    );
  }
  
  if (!CONNECTION_CONFIG.url.startsWith('postgresql://')) {
    throw new Error(
      '❌ Invalid database URL format. ' +
      'Expected postgresql:// connection string.'
    );
  }
}

/**
 * Create standard database connection
 * This is the ONLY way to create database connections in this application
 * Uses HTTP driver (neon) for raw SQL - stateless, no caching
 */
export function createStandardConnection() {
  validateConnection();

  const sqlClient = neon(CONNECTION_CONFIG.url!);
  const db = drizzle(sqlClient);

  return {
    sqlClient,
    db,
    connectionString: CONNECTION_CONFIG.url!
  };
}

/**
 * Get connection info for logging
 */
export function getConnectionInfo() {
  validateConnection();
  
  return {
    driver: CONNECTION_CONFIG.driver,
    url: CONNECTION_CONFIG.url!.substring(0, 30) + '...',
    environment: process.env.NODE_ENV || 'development'
  };
}

/**
 * Verify connection is working
 */
export async function verifyConnection() {
  try {
    const { db } = createStandardConnection();
    await db.execute(sql`SELECT 1 as test`);
    return true;
  } catch (error: any) {
    console.error('❌ Database connection verification failed:', error?.message || error);
    return false;
  }
}

// Re-export sql and drizzle for convenience
export { sql } from 'drizzle-orm';
export { drizzle } from 'drizzle-orm/neon-http';
export { neon } from '@neondatabase/serverless';
