require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function testJoin() {
  try {
    console.log('🔍 Testing JOIN between flow_metrics_config and canonical_stage_mappings...');
    
    // Test 1: Simple JOIN query
    console.log('\n📝 Test 1: Simple JOIN query');
    const joinResult = await sql`
      SELECT 
        fmc.id,
        fmc.display_title,
        fmc.canonical_stage,
        csm.metric_config_id,
        csm.start_stage_id,
        csm.end_stage_id,
        csm.avg_min_days,
        csm.avg_max_days,
        csm.metric_comment
      FROM flow_metrics_config fmc
      LEFT JOIN canonical_stage_mappings csm ON csm.metric_config_id = fmc.id
      WHERE fmc.is_active = true
      ORDER BY fmc.sort_order, fmc.display_title
    `;
    
    console.log('\n📊 JOIN Results:');
    joinResult.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.display_title}:`);
      console.log(`     - ID: ${row.id}`);
      console.log(`     - Canonical Stage: ${row.canonical_stage}`);
      console.log(`     - Metric Config ID: ${row.metric_config_id || 'NULL'}`);
      console.log(`     - Start Stage ID: ${row.start_stage_id || 'NULL'}`);
      console.log(`     - End Stage ID: ${row.end_stage_id || 'NULL'}`);
      console.log(`     - Avg Min Days: ${row.avg_min_days || 'NULL'}`);
      console.log(`     - Avg Max Days: ${row.avg_max_days || 'NULL'}`);
      console.log(`     - Metric Comment: ${row.metric_comment || 'NULL'}`);
      console.log('');
    });
    
    // Test 2: Check specific metric
    console.log('\n📝 Test 2: Check specific metric (Order Conversion)');
    const orderConversion = await sql`
      SELECT 
        fmc.id,
        fmc.display_title,
        fmc.canonical_stage,
        csm.metric_config_id,
        csm.start_stage_id,
        csm.end_stage_id,
        csm.avg_min_days,
        csm.avg_max_days,
        csm.metric_comment
      FROM flow_metrics_config fmc
      LEFT JOIN canonical_stage_mappings csm ON csm.metric_config_id = fmc.id
      WHERE fmc.metric_key = 'order-conversion'
    `;
    
    console.log('\n📊 Order Conversion Results:');
    orderConversion.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.display_title}:`);
      console.log(`     - ID: ${row.id}`);
      console.log(`     - Metric Config ID: ${row.metric_config_id || 'NULL'}`);
      console.log(`     - Start Stage ID: ${row.start_stage_id || 'NULL'}`);
      console.log(`     - End Stage ID: ${row.end_stage_id || 'NULL'}`);
      console.log(`     - Avg Min Days: ${row.avg_min_days || 'NULL'}`);
      console.log(`     - Avg Max Days: ${row.avg_max_days || 'NULL'}`);
      console.log(`     - Metric Comment: ${row.metric_comment || 'NULL'}`);
      console.log('');
    });
    
    // Test 3: Check canonical_stage_mappings directly
    console.log('\n📝 Test 3: Check canonical_stage_mappings directly');
    const mappings = await sql`
      SELECT 
        canonical_stage,
        metric_config_id,
        start_stage_id,
        end_stage_id,
        avg_min_days,
        avg_max_days,
        metric_comment
      FROM canonical_stage_mappings
      WHERE canonical_stage = 'Order Conversion'
      ORDER BY created_at
    `;
    
    console.log('\n📊 Canonical Stage Mappings for Order Conversion:');
    mappings.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.canonical_stage}:`);
      console.log(`     - Metric Config ID: ${row.metric_config_id}`);
      console.log(`     - Start Stage ID: ${row.start_stage_id}`);
      console.log(`     - End Stage ID: ${row.end_stage_id}`);
      console.log(`     - Avg Min Days: ${row.avg_min_days}`);
      console.log(`     - Avg Max Days: ${row.avg_max_days}`);
      console.log(`     - Metric Comment: ${row.metric_comment}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error testing JOIN:', error);
    throw error;
  }
}

// Run the script
testJoin()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

