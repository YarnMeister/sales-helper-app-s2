require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function fixMetricConfigIds() {
  try {
    console.log('🔧 Fixing metric_config_id references...');
    
    // Define the correct mappings
    const correctMappings = [
      { canonical_stage: 'Delivery', metric_config_id: '9614693f-6263-4576-a1a6-122bb7e933de' },
      { canonical_stage: 'Manufacturing', metric_config_id: '24e164f3-61af-40fe-8064-2b4485f29e73' },
      { canonical_stage: 'Order Conversion', metric_config_id: 'cf56a397-1adc-4c87-b6e3-02bcda4ec7f1' },
      { canonical_stage: 'Procurement', metric_config_id: '503d0890-9908-459d-a129-52e8a34ada94' }
    ];
    
    // Update each canonical stage mapping
    for (const mapping of correctMappings) {
      const result = await sql`
        UPDATE canonical_stage_mappings 
        SET metric_config_id = ${mapping.metric_config_id}
        WHERE canonical_stage = ${mapping.canonical_stage}
      `;
      
      console.log(`  ✅ Updated "${mapping.canonical_stage}": ${result.length} rows`);
    }
    
    // Verify the relationships
    console.log('\n📝 Verifying relationships...');
    
    const verification = await sql`
      SELECT 
        csm.canonical_stage,
        csm.metric_config_id,
        fmc.display_title,
        csm.start_stage_id,
        csm.end_stage_id,
        csm.avg_min_days,
        csm.avg_max_days
      FROM canonical_stage_mappings csm
      LEFT JOIN flow_metrics_config fmc ON csm.metric_config_id = fmc.id
      ORDER BY csm.canonical_stage
    `;
    
    console.log('\n📊 Verification Results:');
    verification.forEach(row => {
      const status = row.metric_config_id ? '✅' : '❌';
      console.log(`  ${status} ${row.canonical_stage}: ${row.display_title || 'NO MATCH'} (ID: ${row.metric_config_id || 'NULL'})`);
    });
    
    // Test the getFlowMetricsConfig function
    console.log('\n📝 Testing getFlowMetricsConfig function...');
    
    const testResult = await sql`
      SELECT 
        fmc.*,
        csm.start_stage_id,
        csm.end_stage_id,
        csm.avg_min_days,
        csm.avg_max_days,
        csm.metric_comment
      FROM flow_metrics_config fmc
      LEFT JOIN canonical_stage_mappings csm ON csm.metric_config_id = fmc.id
      ORDER BY fmc.sort_order, fmc.display_title
    `;
    
    console.log('\n📊 Flow Metrics Config Results:');
    testResult.forEach(row => {
      const hasMapping = row.start_stage_id || row.end_stage_id || row.avg_min_days || row.avg_max_days;
      const status = hasMapping ? '✅' : '❌';
      console.log(`  ${status} ${row.display_title}: ${row.start_stage_id || 'NULL'} → ${row.end_stage_id || 'NULL'} (${row.avg_min_days || 'NULL'}-${row.avg_max_days || 'NULL'} days)`);
    });
    
    console.log('\n🎉 Metric config ID references fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing metric config IDs:', error);
    throw error;
  }
}

// Run the script
fixMetricConfigIds()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
