#!/usr/bin/env tsx
/**
 * Run the UUID migration directly (outside of Drizzle)
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws as any;

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🚀 Running UUID migration directly...\n');

    // Read the migration file
    const migrationSQL = readFileSync('./lib/database/migrations/0002_fix_flow_metrics_id_to_uuid.sql', 'utf-8');
    
    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n🔄 Executing...\n');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify the result
    const result = await pool.query(`
      SELECT id, metric_key, pg_typeof(id) as id_type 
      FROM flow_metrics_config 
      ORDER BY sort_order
    `);

    console.log('📊 Verification:');
    result.rows.forEach((row: any) => {
      console.log(`  ${row.metric_key}: id=${row.id} (type: ${row.id_type})`);
    });
    console.log('');

  } catch (error: any) {
    console.error('❌ Migration failed:', error?.message || error);
    if (error?.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

