#!/usr/bin/env tsx
/**
 * WebSocket Migration Runner
 * 
 * Runs all pending Drizzle migrations using WebSocket driver.
 * This is the ONLY migration runner for this project.
 * 
 * Features:
 * - Uses WebSocket driver (supports multi-statement SQL)
 * - Reads from lib/database/migrations/ (Drizzle-managed)
 * - Tracks migrations in __drizzle_migrations table
 * - Idempotent (safe to run multiple times)
 * 
 * Usage:
 *   npm run db:migrate
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from 'ws';
import dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '.env.local' });
dotenv.config();

// Configure WebSocket
neonConfig.webSocketConstructor = ws as any;

async function runMigrations() {
  console.log('🚀 Running database migrations...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  try {
    console.log('📂 Migration folder: lib/database/migrations/');
    console.log('🔌 Driver: WebSocket (Neon)\n');
    
    await migrate(db, { migrationsFolder: './lib/database/migrations' });
    
    console.log('\n✅ Migrations completed successfully!\n');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

