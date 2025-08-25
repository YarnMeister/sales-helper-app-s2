const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function cleanupFlowData() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const sql = neon(connectionString);
  try {
    console.log('Cleaning up old flow data records...');
    
    const result = await sql`DELETE FROM pipedrive_deal_flow_data WHERE pipedrive_event_id IS NULL`;
    
    console.log(`Deleted ${result.length} old records without pipedrive_event_id`);
    
    // Check remaining records
    const remaining = await sql`SELECT COUNT(*) as count FROM pipedrive_deal_flow_data`;
    console.log(`Remaining records: ${remaining[0].count}`);
    
  } catch (error) {
    console.error('Error cleaning up flow data:', error);
  } finally {
    process.exit(0);
  }
}

cleanupFlowData();
