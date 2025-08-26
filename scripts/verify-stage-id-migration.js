const { Pool } = require('pg');
require('dotenv').config();

async function verifyStageIdMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Verifying stage ID migration...\n');

    // Check if the columns exist
    const columnCheckQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'canonical_stage_mappings' 
      AND column_name IN ('start_stage_id', 'end_stage_id')
      ORDER BY column_name;
    `;

    const columnResult = await pool.query(columnCheckQuery);
    
    console.log('1. Checking stage ID columns...');
    if (columnResult.rows.length === 0) {
      console.log('   ❌ Stage ID columns do not exist!');
      console.log('   Expected columns: start_stage_id, end_stage_id');
      return false;
    }

    console.log('   ✅ Found stage ID columns:');
    columnResult.rows.forEach(row => {
      console.log(`      - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check if the constraint exists
    const constraintCheckQuery = `
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'canonical_stage_mappings' 
      AND constraint_name = 'check_stage_mapping_method';
    `;

    const constraintResult = await pool.query(constraintCheckQuery);
    
    console.log('\n2. Checking constraint...');
    if (constraintResult.rows.length === 0) {
      console.log('   ❌ Constraint check_stage_mapping_method does not exist!');
      return false;
    }

    console.log('   ✅ Constraint exists:', constraintResult.rows[0].constraint_name);

    // Check if indexes exist
    const indexCheckQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'canonical_stage_mappings' 
      AND indexname IN ('idx_csm_start_stage_id', 'idx_csm_end_stage_id');
    `;

    const indexResult = await pool.query(indexCheckQuery);
    
    console.log('\n3. Checking indexes...');
    if (indexResult.rows.length === 0) {
      console.log('   ❌ Stage ID indexes do not exist!');
      return false;
    }

    console.log('   ✅ Found indexes:');
    indexResult.rows.forEach(row => {
      console.log(`      - ${row.indexname}`);
    });

    // Test inserting a record with stage IDs
    console.log('\n4. Testing stage ID functionality...');
    const testInsertQuery = `
      INSERT INTO canonical_stage_mappings 
      (canonical_stage, start_stage_id, end_stage_id, created_at, updated_at)
      VALUES ('TEST_STAGE', 104, 108, NOW(), NOW())
      ON CONFLICT (canonical_stage) DO NOTHING
      RETURNING id, canonical_stage, start_stage_id, end_stage_id;
    `;

    const insertResult = await pool.query(testInsertQuery);
    
    if (insertResult.rows.length > 0) {
      console.log('   ✅ Successfully inserted test record with stage IDs');
      console.log(`      - ID: ${insertResult.rows[0].id}`);
      console.log(`      - Stage: ${insertResult.rows[0].canonical_stage}`);
      console.log(`      - Start ID: ${insertResult.rows[0].start_stage_id}`);
      console.log(`      - End ID: ${insertResult.rows[0].end_stage_id}`);
      
      // Clean up test record
      await pool.query(`
        DELETE FROM canonical_stage_mappings 
        WHERE canonical_stage = 'TEST_STAGE'
      `);
      console.log('   ✅ Test record cleaned up');
    } else {
      console.log('   ⚠️  Test record already exists (not an error)');
    }

    console.log('\n🎉 Stage ID migration verification complete!');
    console.log('   All columns, constraints, and indexes are properly configured.');
    return true;

  } catch (error) {
    console.error('❌ Error verifying stage ID migration:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

verifyStageIdMigration().then(success => {
  process.exit(success ? 0 : 1);
});
