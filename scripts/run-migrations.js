/**
 * Drizzle Migration Runner
 * Runs all pending migrations from lib/database/migrations/
 * Safe for CI/CD - no interactive prompts
 * Uses node-postgres for reliable build-time execution
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

const { Pool } = pg;

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function runMigrations() {
  // Prefer unpooled connection for migrations, fallback to pooled
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not set');
    process.exit(1);
  }
  
  console.log('Using connection:', connectionString.substring(0, 30) + '...');

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Checking for pending migrations...');
    
    const db = drizzle(pool);

    await migrate(db, { 
      migrationsFolder: './lib/database/migrations',
      migrationsTable: '__drizzle_migrations'
    });

    console.log('✅ Migrations complete!');
  } catch (error) {
    // Check if error is about missing migrations folder
    if (error.message?.includes('ENOENT') || error.message?.includes('no such file')) {
      console.log('⚠️  No migrations folder found - skipping migrations');
      console.log('   (This is expected if you haven\'t created any migrations yet)');
      process.exit(0);
    }
    
    // Check if error is about no pending migrations
    if (error.message?.includes('No migrations') || error.message?.includes('up to date')) {
      console.log('✅ Database is up to date - no migrations needed');
      process.exit(0);
    }
    
    // Check if error is about objects already existing
    if (error.message?.includes('already exists') || error.cause?.code === '42710' || error.cause?.code === '42P07') {
      console.log('⚠️  Schema objects already exist - assuming database is up to date');
      console.log('   Tip: Run "npm run db:reset-dev" to start fresh with migrations');
      process.exit(0);
    }
    
    console.error('❌ Migration failed:', error.message);
    console.error('   Cause:', error.cause?.message || 'Unknown');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

