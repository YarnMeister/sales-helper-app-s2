/**
 * Reset dev database to match production state
 * Drops tables that don't exist in production
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function resetDevDatabase() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('🔄 Resetting dev database to match production state...\n');

    // Drop tables that don't exist in production
    console.log('Dropping kv_cache...');
    try {
      await sql`DROP TABLE IF EXISTS kv_cache CASCADE`;
      console.log(`✅ Dropped table: kv_cache`);
    } catch (error) {
      console.log(`⚠️  Could not drop kv_cache: ${error.message}`);
    }
    
    console.log('Dropping flow_metrics...');
    try {
      await sql`DROP TABLE IF EXISTS flow_metrics CASCADE`;
      console.log(`✅ Dropped table: flow_metrics`);
    } catch (error) {
      console.log(`⚠️  Could not drop flow_metrics: ${error.message}`);
    }
    
    console.log('Dropping mock_requests...');
    try {
      await sql`DROP TABLE IF EXISTS mock_requests CASCADE`;
      console.log(`✅ Dropped table: mock_requests`);
    } catch (error) {
      console.log(`⚠️  Could not drop mock_requests: ${error.message}`);
    }

    console.log('\n✅ Dev database reset complete!');
    console.log('📝 Next step: Run `npm run db:push` to sync schema');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDevDatabase();

