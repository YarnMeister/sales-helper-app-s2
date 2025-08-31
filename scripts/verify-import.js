require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function verifyImport() {
  try {
    console.log('🔍 Verifying imported data...');
    
    const rows = await sql`
      SELECT canonical_stage, start_stage_id, end_stage_id, avg_min_days, avg_max_days 
      FROM canonical_stage_mappings 
      ORDER BY canonical_stage
    `;
    
    console.log('📊 Imported data:');
    rows.forEach(row => {
      console.log(`  - ${row.canonical_stage}: ${row.start_stage_id} → ${row.end_stage_id} (${row.avg_min_days}-${row.avg_max_days} days)`);
    });
    
    console.log(`\n✅ Total rows: ${rows.length}`);
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  }
}

verifyImport();
