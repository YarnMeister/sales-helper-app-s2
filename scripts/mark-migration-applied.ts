#!/usr/bin/env tsx
/**
 * Mark migration 0002 as applied in Drizzle tracking table
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';
import { resolve } from 'path';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws as any;

async function markMigrationApplied() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('📝 Marking migration 0002 as applied...\n');

    // Read the migration file to calculate hash
    const migrationSQL = readFileSync('./lib/database/migrations/0002_fix_flow_metrics_id_to_uuid.sql', 'utf-8');
    const hash = createHash('sha256').update(migrationSQL).digest('hex');

    // Insert into Drizzle tracking table
    await pool.query(`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [hash, 1760588718039]);

    console.log('✅ Migration marked as applied');
    console.log(`   Hash: ${hash}`);
    console.log(`   Timestamp: 1760588718039\n`);

  } catch (error: any) {
    console.error('❌ Error:', error?.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

markMigrationApplied();

