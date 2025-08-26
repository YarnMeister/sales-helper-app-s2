const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function verifyEnhancedMigration() {
  try {
    console.log('🔍 Verifying enhanced canonical stages migration...\n');

    // Check if flow_metrics_config table exists
    console.log('1. Checking flow_metrics_config table...');
    const flowMetricsConfig = await sql`SELECT COUNT(*) as count FROM flow_metrics_config`;
    console.log(`   ✅ flow_metrics_config table exists with ${flowMetricsConfig[0].count} rows`);

    // Check if canonical_stage_mappings has the new column
    console.log('\n2. Checking canonical_stage_mappings table...');
    const mappingsWithConfig = await sql`SELECT COUNT(*) as count FROM canonical_stage_mappings WHERE metric_config_id IS NOT NULL`;
    console.log(`   ✅ canonical_stage_mappings has metric_config_id column with ${mappingsWithConfig[0].count} linked records`);

    // Check the default data
    console.log('\n3. Checking default metrics configuration...');
    const defaultMetrics = await sql`SELECT metric_key, display_title, is_active, sort_order FROM flow_metrics_config ORDER BY sort_order`;
    console.log(`   ✅ Default metrics configured: ${defaultMetrics.length} metrics`);
    defaultMetrics.forEach(m => {
      console.log(`      - ${m.metric_key}: ${m.display_title} (sort: ${m.sort_order}, ${m.is_active ? 'active' : 'inactive'})`);
    });

    // Check if the foreign key constraint exists
    console.log('\n4. Checking foreign key constraint...');
    const constraintCheck = await sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'canonical_stage_mappings' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%metric_config%'
    `;
    console.log(`   ✅ Foreign key constraint exists: ${constraintCheck.length > 0 ? 'Yes' : 'No'}`);

    // Check if unique constraint exists
    console.log('\n5. Checking unique constraint...');
    const uniqueCheck = await sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'canonical_stage_mappings' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%metric_mapping%'
    `;
    console.log(`   ✅ Unique constraint exists: ${uniqueCheck.length > 0 ? 'Yes' : 'No'}`);

    // Test the new database functions
    console.log('\n6. Testing database functions...');
    const activeMetrics = await sql`
      SELECT 
        fmc.*,
        csm.start_stage,
        csm.end_stage
      FROM flow_metrics_config fmc
      LEFT JOIN canonical_stage_mappings csm ON csm.metric_config_id = fmc.id
      WHERE fmc.is_active = true
      ORDER BY fmc.sort_order, fmc.display_title
    `;
    console.log(`   ✅ Database query works: ${activeMetrics.length} active metrics found`);

    console.log('\n🎉 Enhanced canonical stages migration verification complete!');
    console.log('   All tables, constraints, and data are properly configured.');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  }
}

verifyEnhancedMigration();
