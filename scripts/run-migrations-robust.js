/**
 * Robust Drizzle Migration Runner
 * Handles baseline migrations gracefully and only runs new migrations
 * Safe for CI/CD - no interactive prompts
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const { Pool } = pg;

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function runMigrations() {
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

    // Check what migrations exist in the migrations folder
    const migrationsFolder = './lib/database/migrations';
    const journalPath = join(migrationsFolder, 'meta', '_journal.json');
    
    if (!existsSync(journalPath)) {
      console.log('⚠️  No migrations journal found - skipping migrations');
      process.exit(0);
    }

    const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
    const availableMigrations = journal.entries || [];

    // Check what migrations are already applied
    let appliedMigrations = [];
    try {
      const result = await db.execute(sql`SELECT hash FROM __drizzle_migrations ORDER BY id`);
      appliedMigrations = result.rows.map(row => row.hash);
    } catch (error) {
      if (error.message?.includes('relation "__drizzle_migrations" does not exist')) {
        console.log('⚠️  __drizzle_migrations table does not exist - skipping migrations');
        console.log('   Run the init script first to set up Drizzle tracking');
        process.exit(0);
      }
      throw error;
    }

    console.log('📋 Available migrations:', availableMigrations.map(m => m.tag));
    console.log('📋 Applied migrations:', appliedMigrations);

    // Find pending migrations - compare by tag since that's what Drizzle uses
    const pendingMigrations = availableMigrations.filter(migration => 
      !appliedMigrations.includes(migration.tag)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ Database is up to date - no migrations needed');
      process.exit(0);
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
    pendingMigrations.forEach(migration => {
      console.log(`   - ${migration.sql || migration.bps || 'Unknown migration'}`);
    });

    // Run migrations
    await migrate(db, {
      migrationsFolder,
      migrationsTable: '__drizzle_migrations'
    });

    console.log('✅ Migrations complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('   Cause:', error.cause?.message || 'Unknown');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
