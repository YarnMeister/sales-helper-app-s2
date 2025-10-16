#!/usr/bin/env tsx
/**
 * Verify which database the app is actually connecting to
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

async function verifyDatabase() {
  console.log('🔍 Checking app database connection...\n');

  // Check connection string
  console.log('Environment variables:');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 70) + '...');
  console.log('  DATABASE_URL_UNPOOLED:', process.env.DATABASE_URL_UNPOOLED?.substring(0, 70) + '...');
  console.log('');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Query the actual data
    const result = await pool.query(`
      SELECT id, metric_key, pg_typeof(id) as id_type
      FROM flow_metrics_config
      ORDER BY sort_order
    `);

    console.log('📊 Data from DATABASE_URL connection:');
    result.rows.forEach((row: any) => {
      console.log(`  ${row.metric_key}: id=${row.id} (type: ${row.id_type})`);
    });
    console.log('');

  } catch (error: any) {
    console.error('❌ Error:', error?.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyDatabase();

