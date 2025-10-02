#!/usr/bin/env tsx
/**
 * WebSocket-based migration runner
 * 
 * Uses Neon's WebSocket driver which supports multi-statement SQL
 * This is the ONLY migration runner - no other scripts should run migrations
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from 'ws';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws as any;

async function runMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🚀 Running database migrations...');
  console.log('📂 Migration folder: lib/database/migrations/');
  console.log('🔌 Driver: WebSocket (Neon)');
  console.log('');

  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool);

  try {
    await migrate(db, { 
      migrationsFolder: './lib/database/migrations'
    });
    
    console.log('');
    console.log('✅ Migrations completed successfully!');
    console.log('');
  } catch (error: any) {
    console.error('');
    console.error('❌ Migration failed:', error?.message || error);
    console.error('');
    if (error?.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

