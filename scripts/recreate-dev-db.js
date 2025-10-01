/**
 * Recreate dev database from scratch to match production schema
 * This is a one-time operation to reset dev to a known state
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function recreateDevDatabase() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('🔄 Recreating dev database from scratch...\n');

    // Drop ALL tables (CASCADE will handle foreign keys)
    const allTables = [
      'canonical_stage_mappings',
      'flow_metrics_config', 
      'pipedrive_deal_flow_data',
      'pipedrive_metric_data',
      'pipedrive_submissions',
      'requests',
      'schema_migrations',
      'site_visits',
      'kv_cache',
      'flow_metrics',
      'mock_requests'
    ];
    
    console.log('📋 Dropping all existing tables...');
    
    // Drop tables manually (can't use template literals with table names)
    await sql`DROP TABLE IF EXISTS canonical_stage_mappings CASCADE`;
    await sql`DROP TABLE IF EXISTS flow_metrics_config CASCADE`;
    await sql`DROP TABLE IF EXISTS pipedrive_deal_flow_data CASCADE`;
    await sql`DROP TABLE IF EXISTS pipedrive_metric_data CASCADE`;
    await sql`DROP TABLE IF EXISTS pipedrive_submissions CASCADE`;
    await sql`DROP TABLE IF EXISTS requests CASCADE`;
    await sql`DROP TABLE IF EXISTS schema_migrations CASCADE`;
    await sql`DROP TABLE IF EXISTS site_visits CASCADE`;
    await sql`DROP TABLE IF EXISTS kv_cache CASCADE`;
    await sql`DROP TABLE IF EXISTS flow_metrics CASCADE`;
    await sql`DROP TABLE IF EXISTS mock_requests CASCADE`;
    
    console.log('  ✓ All tables dropped');

    console.log('\n✅ All tables dropped!');
    console.log('📝 Next: Use Drizzle to create fresh tables from schema.ts');
    console.log('   Run: npx drizzle-kit push --force');
    
  } catch (error) {
    console.error('❌ Error recreating database:', error);
    process.exit(1);
  }
}

recreateDevDatabase();

