require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function fixCanonicalStageMappingRelationships() {
  try {
    console.log('🔧 Fixing canonical stage mapping relationships...');
    
    // Step 1: Update canonical stage names to match flow_metrics_config
    console.log('📝 Step 1: Updating canonical stage names...');
    
    const updateMappings = [
      { old: 'Deliveries: MetCoAir', new: 'Delivery' },
      { old: 'Deliveries: OEM', new: 'Delivery' },
      { old: 'Order: Cables', new: 'Order Conversion' },
      { old: 'Order: General Supplies', new: 'Order Conversion' },
      { old: 'Order: MetCoAir', new: 'Order Conversion' },
      { old: 'Order: OEM', new: 'Order Conversion' },
      { old: 'Procurement: Cable', new: 'Procurement' },
      { old: 'Procurement: OEM + General Supplies', new: 'Procurement' },
      { old: 'Repairs: MetCoAir', new: 'Manufacturing' },
      { old: 'Repairs: OEM', new: 'Manufacturing' }
    ];
    
    for (const mapping of updateMappings) {
      const result = await sql`
        UPDATE canonical_stage_mappings 
        SET canonical_stage = ${mapping.new}
        WHERE canonical_stage = ${mapping.old}
      `;
      console.log(`  ✅ Updated "${mapping.old}" → "${mapping.new}": ${result.length} rows`);
    }
    
    // Step 2: Update metric_config_id references
    console.log('\n📝 Step 2: Updating metric_config_id references...');
    
    const result = await sql`
      UPDATE canonical_stage_mappings 
      SET metric_config_id = (
        SELECT id FROM flow_metrics_config 
        WHERE canonical_stage = canonical_stage_mappings.canonical_stage
        LIMIT 1
      )
      WHERE metric_config_id IS NULL
    `;
    
    console.log(`  ✅ Updated ${result.length} metric_config_id references`);
    
    // Step 3: Verify the relationships
    console.log('\n📝 Step 3: Verifying relationships...');
    
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
    
    // Step 4: Check for any unmapped metrics
    console.log('\n📝 Step 4: Checking for unmapped metrics...');
    
    const unmapped = await sql`
      SELECT 
        fmc.canonical_stage,
        fmc.display_title,
        fmc.id
      FROM flow_metrics_config fmc
      LEFT JOIN canonical_stage_mappings csm ON csm.metric_config_id = fmc.id
      WHERE csm.id IS NULL
    `;
    
    if (unmapped.length > 0) {
      console.log('\n⚠️  Unmapped metrics found:');
      unmapped.forEach(row => {
        console.log(`  - ${row.display_title} (${row.canonical_stage}) - ID: ${row.id}`);
      });
    } else {
      console.log('\n✅ All metrics are properly mapped!');
    }
    
    console.log('\n🎉 Canonical stage mapping relationships fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing canonical stage mapping relationships:', error);
    throw error;
  }
}

// Run the script
fixCanonicalStageMappingRelationships()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
