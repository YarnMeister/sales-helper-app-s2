#!/usr/bin/env tsx
/**
 * Check for foreign key constraints on flow_metrics_config table
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws as any;

async function checkForeignKeys() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🔍 Checking foreign key constraints on flow_metrics_config...\n');

    const result = await pool.query(`
      SELECT
          tc.table_name AS referencing_table,
          kcu.column_name AS referencing_column,
          ccu.table_name AS referenced_table,
          ccu.column_name AS referenced_column,
          tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
          AND (ccu.table_name = 'flow_metrics_config' OR tc.table_name = 'flow_metrics_config')
    `);

    if (result.rows.length === 0) {
      console.log('✅ No foreign key constraints found on flow_metrics_config table');
      console.log('   Safe to drop and recreate the table\n');
    } else {
      console.log('⚠️  Found foreign key constraints:\n');
      result.rows.forEach((row: any) => {
        console.log(`  ${row.referencing_table}.${row.referencing_column}`);
        console.log(`    → ${row.referenced_table}.${row.referenced_column}`);
        console.log(`    Constraint: ${row.constraint_name}\n`);
      });
    }
  } catch (error: any) {
    console.error('❌ Error checking foreign keys:', error?.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkForeignKeys();

