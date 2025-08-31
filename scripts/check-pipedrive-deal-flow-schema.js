require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkPipedriveDealFlowSchema() {
  try {
    console.log('🔍 Checking pipedrive_deal_flow_data table schema...');
    
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pipedrive_deal_flow_data' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Current columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  }
}

checkPipedriveDealFlowSchema();
