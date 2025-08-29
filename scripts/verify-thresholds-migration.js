const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function verifyThresholdsMigration() {
  console.log('🔍 Verifying thresholds and comments migration...\n');

  try {
    // Check if the new columns exist
    console.log('1. Checking for new columns in canonical_stage_mappings...');
    
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'canonical_stage_mappings' 
      AND column_name IN ('avg_min_days', 'avg_max_days', 'metric_comment')
      ORDER BY column_name
    `;
    
    if (columns.length === 3) {
      console.log('   ✅ All new columns found:');
      columns.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('   ❌ Missing columns:', columns.map(c => c.column_name));
      return;
    }

    // Check if the constraint exists
    console.log('\n2. Checking constraint...');
    const constraints = await sql`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints 
      WHERE constraint_name = 'check_avg_thresholds'
    `;
    
    if (constraints.length > 0) {
      console.log('   ✅ Constraint check_avg_thresholds exists');
    } else {
      console.log('   ❌ Constraint check_avg_thresholds not found');
    }

    // Test the constraint
    console.log('\n3. Testing constraint validation...');
    
    // This should work (valid values)
    try {
      await sql`
        INSERT INTO canonical_stage_mappings (canonical_stage, start_stage, end_stage, avg_min_days, avg_max_days)
        VALUES ('Test Stage', 'Start', 'End', 1, 5)
        ON CONFLICT DO NOTHING
      `;
      console.log('   ✅ Valid threshold values (1, 5) accepted');
    } catch (error) {
      console.log('   ❌ Valid threshold values rejected:', error.message);
    }

    // This should fail (invalid values)
    try {
      await sql`
        INSERT INTO canonical_stage_mappings (canonical_stage, start_stage, end_stage, avg_min_days, avg_max_days)
        VALUES ('Test Stage 2', 'Start', 'End', 10, 5)
        ON CONFLICT DO NOTHING
      `;
      console.log('   ❌ Invalid threshold values (10, 5) were accepted - constraint may not be working');
    } catch (error) {
      console.log('   ✅ Invalid threshold values (10, 5) correctly rejected:', error.message);
    }

    // Check existing data
    console.log('\n4. Checking existing data...');
    const existingData = await sql`
      SELECT 
        canonical_stage,
        avg_min_days,
        avg_max_days,
        metric_comment
      FROM canonical_stage_mappings 
      LIMIT 5
    `;
    
    console.log(`   📊 Found ${existingData.length} existing mappings`);
    existingData.forEach(row => {
      console.log(`      - ${row.canonical_stage}: min=${row.avg_min_days || 'null'}, max=${row.avg_max_days || 'null'}, comment=${row.metric_comment ? 'set' : 'null'}`);
    });

    console.log('\n🎉 Thresholds and comments migration verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyThresholdsMigration();
