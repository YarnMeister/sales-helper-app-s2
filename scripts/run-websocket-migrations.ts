#!/usr/bin/env tsx
/**
 * Phase 0: Bootstrap WebSocket Migrations
 * 
 * One-time script to run migrations 022-026 using WebSocket driver.
 * These migrations contain multi-statement SQL that cannot be executed
 * with the Neon HTTP driver.
 * 
 * After this runs successfully, we'll switch to the two-mode system.
 * 
 * Usage:
 *   npm run db:bootstrap-websocket
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws as any;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const MIGRATION_FILES = [
  '022_flow_metrics_cross_pipeline_support.sql',
  '023_flow_metrics_inline_jsonb_check.sql',
  // Skip 024 and 025 - they're redundant with 023 and conflict with 026
  // '024_flow_metrics_force_drop_old_check.sql',
  // '025_flow_metrics_drop_and_replace_check.sql',
  '026_flow_metrics_clean_rebuild.sql', // Clean rebuild - supersedes 024 and 025
];

interface MigrationRecord {
  id: string;
  hash: string;
  created_at: string;
}

async function ensureMigrationsTable(pool: Pool): Promise<void> {
  console.log('📋 Ensuring __drizzle_migrations table exists...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL UNIQUE,
      created_at BIGINT NOT NULL
    );
  `;
  
  await pool.query(createTableSQL);
  console.log('✅ __drizzle_migrations table ready\n');
}

async function getAppliedMigrations(pool: Pool): Promise<Set<string>> {
  const result = await pool.query<MigrationRecord>(
    'SELECT hash FROM __drizzle_migrations ORDER BY created_at'
  );
  
  return new Set(result.rows.map(row => row.hash));
}

async function markMigrationAsApplied(pool: Pool, migrationName: string): Promise<void> {
  const timestamp = Date.now();

  // Check if migration already exists
  const existingResult = await pool.query(
    'SELECT id FROM __drizzle_migrations WHERE hash = $1',
    [migrationName]
  );

  if (existingResult.rows.length === 0) {
    // Insert only if it doesn't exist
    await pool.query(
      'INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2)',
      [migrationName, timestamp]
    );
  }
}

async function runMigration(pool: Pool, fileName: string): Promise<void> {
  const filePath = path.join(MIGRATIONS_DIR, fileName);
  const migrationName = fileName.replace('.sql', '');
  
  console.log(`🔄 Running migration: ${migrationName}...`);
  
  // Read migration file
  const sql = fs.readFileSync(filePath, 'utf-8');
  
  try {
    // Execute the migration (WebSocket driver supports multi-statement SQL)
    await pool.query(sql);
    
    // Mark as applied
    await markMigrationAsApplied(pool, migrationName);
    
    console.log(`✅ ${migrationName} completed successfully\n`);
  } catch (error: any) {
    console.error(`❌ ${migrationName} failed:`, error.message);
    throw error;
  }
}

async function bootstrap() {
  console.log('🚀 Phase 0: Bootstrap WebSocket Migrations\n');
  console.log('This script will run migrations 022-026 using WebSocket driver.');
  console.log('These migrations contain multi-statement SQL that requires WebSocket.\n');
  
  // Validate environment
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Migrations directory: ${MIGRATIONS_DIR}\n`);
  
  // Create pool with WebSocket
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Ensure migrations table exists
    await ensureMigrationsTable(pool);
    
    // Get already applied migrations
    const appliedMigrations = await getAppliedMigrations(pool);
    console.log(`📊 Already applied migrations: ${appliedMigrations.size}`);
    
    if (appliedMigrations.size > 0) {
      console.log('   Applied:', Array.from(appliedMigrations).join(', '));
    }
    console.log('');
    
    // Run each migration
    let executed = 0;
    let skipped = 0;
    
    for (const fileName of MIGRATION_FILES) {
      const migrationName = fileName.replace('.sql', '');
      
      if (appliedMigrations.has(migrationName)) {
        console.log(`⏭️  Skipping ${migrationName} (already applied)\n`);
        skipped++;
        continue;
      }
      
      await runMigration(pool, fileName);
      executed++;
    }
    
    // Summary
    console.log('━'.repeat(60));
    console.log('✅ Bootstrap completed successfully!\n');
    console.log(`📊 Summary:`);
    console.log(`   - Executed: ${executed} migrations`);
    console.log(`   - Skipped: ${skipped} migrations`);
    console.log(`   - Total: ${MIGRATION_FILES.length} migrations\n`);
    
    // Verify flow_metrics_config table
    console.log('🔍 Verifying flow_metrics_config table...');
    const verifyResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'flow_metrics_config' 
      AND column_name = 'config'
    `);
    
    if (verifyResult.rows.length > 0) {
      const configColumn = verifyResult.rows[0];
      console.log(`✅ flow_metrics_config.config column exists`);
      console.log(`   Type: ${configColumn.data_type}`);
      
      if (configColumn.data_type === 'jsonb') {
        console.log('   ✅ JSONB structure confirmed!\n');
      } else {
        console.log(`   ⚠️  Expected 'jsonb', got '${configColumn.data_type}'\n`);
      }
    } else {
      console.log('⚠️  flow_metrics_config.config column not found\n');
    }
    
    console.log('━'.repeat(60));
    console.log('\n🎉 Phase 0 complete! Production is ready for flow metrics.\n');
    console.log('Next steps:');
    console.log('1. Test creating/saving metrics in production');
    console.log('2. Proceed to Phase 1 (Two-Mode Infrastructure)\n');
    
  } catch (error: any) {
    console.error('\n❌ Bootstrap failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run bootstrap
bootstrap();

