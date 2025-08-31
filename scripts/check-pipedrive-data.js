require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkPipedriveData() {
  try {
    console.log('🔍 Checking pipedrive_deal_flow_data table...');
    
    const countResult = await sql`SELECT COUNT(*) as count FROM pipedrive_deal_flow_data`;
    const count = countResult[0].count;
    
    console.log(`📊 Total rows: ${count}`);
    
    if (count > 0) {
      const sampleData = await sql`
        SELECT deal_id, stage_name, entered_at, left_at, duration_seconds 
        FROM pipedrive_deal_flow_data 
        ORDER BY entered_at DESC 
        LIMIT 5
      `;
      
      console.log('📋 Sample data:');
      sampleData.forEach(row => {
        console.log(`  - Deal ${row.deal_id}: ${row.stage_name} (${row.entered_at})`);
      });
    } else {
      console.log('❌ No data found in pipedrive_deal_flow_data table');
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  }
}

checkPipedriveData();
