require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function debugDealFlowData() {
  try {
    console.log('🔍 Debugging getDealFlowData function...');
    
    // Test 1: Direct SQL query without deal ID
    console.log('\n📊 Test 1: Direct SQL query without deal ID');
    const result1 = await sql`SELECT * FROM pipedrive_deal_flow_data ORDER BY entered_at DESC`;
    console.log(`Result: ${result1.length} rows`);
    
    if (result1.length > 0) {
      console.log('Sample row:', result1[0]);
    }
    
    // Test 2: Direct SQL query with deal ID
    console.log('\n📊 Test 2: Direct SQL query with deal ID 1205');
    const result2 = await sql`SELECT * FROM pipedrive_deal_flow_data WHERE deal_id = 1205 ORDER BY entered_at DESC`;
    console.log(`Result: ${result2.length} rows`);
    
    // Test 3: Check if table exists
    console.log('\n📊 Test 3: Check if table exists');
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'pipedrive_deal_flow_data'
    `;
    console.log('Table exists:', tableCheck.length > 0);
    
    // Test 4: Count total rows
    console.log('\n📊 Test 4: Count total rows');
    const countResult = await sql`SELECT COUNT(*) as count FROM pipedrive_deal_flow_data`;
    console.log(`Total rows: ${countResult[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugDealFlowData();
