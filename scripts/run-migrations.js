/**
 * Drizzle Migration Runner
 * Runs all pending migrations from lib/database/migrations/
 * Safe for CI/CD - no interactive prompts
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  try {
    console.log('🔄 Checking for pending migrations...');
    
    const sql = neon(connectionString);
    const db = drizzle(sql);

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
  }
}

runMigrations();

