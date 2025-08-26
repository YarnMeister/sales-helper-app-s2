const { Pool } = require('pg');
require('dotenv').config();

async function debugMigration17() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Debugging migration 17 issue...\n');

    // Check migrations table
    console.log('1. Checking migrations table...');
    const migrationsResult = await pool.query(`
      SELECT * FROM schema_migrations WHERE version = 17 OR name = 'stage_id_mappings'
    `);
    
          if (migrationsResult.rows.length === 0) {
        console.log('   ❌ Migration 17 not found in tracking table');
      } else {
        console.log('   ✅ Migration 17 found in tracking table:');
        migrationsResult.rows.forEach(row => {
          console.log(`      - Version: ${row.version}, Name: ${row.name}, Executed: ${row.executed_at}`);
        });
      }

    // Check if canonical_stage_mappings table exists
    console.log('\n2. Checking canonical_stage_mappings table...');
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'canonical_stage_mappings'
      );
    `);
    
    if (tableResult.rows[0].exists) {
      console.log('   ✅ canonical_stage_mappings table exists');
    } else {
      console.log('   ❌ canonical_stage_mappings table does not exist');
      return;
    }

    // Check all columns in the table
    console.log('\n3. Checking table columns...');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'canonical_stage_mappings'
      ORDER BY ordinal_position;
    `);
    
    console.log('   All columns:');
    columnsResult.rows.forEach(row => {
      console.log(`      - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check specifically for stage ID columns
    const stageIdColumns = columnsResult.rows.filter(row => 
      row.column_name === 'start_stage_id' || row.column_name === 'end_stage_id'
    );

    console.log('\n4. Stage ID columns status:');
    if (stageIdColumns.length === 0) {
      console.log('   ❌ Stage ID columns are missing!');
      console.log('   Expected: start_stage_id, end_stage_id');
      
      // Try to manually add the columns
      console.log('\n5. Attempting to manually add stage ID columns...');
      try {
        await pool.query(`
          ALTER TABLE canonical_stage_mappings 
          ADD COLUMN start_stage_id INTEGER,
          ADD COLUMN end_stage_id INTEGER;
        `);
        console.log('   ✅ Successfully added stage ID columns');
        
        // Add indexes
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_csm_start_stage_id ON canonical_stage_mappings(start_stage_id);
          CREATE INDEX IF NOT EXISTS idx_csm_end_stage_id ON canonical_stage_mappings(end_stage_id);
        `);
        console.log('   ✅ Successfully added indexes');
        
        // Add constraint
        await pool.query(`
          ALTER TABLE canonical_stage_mappings 
          ADD CONSTRAINT check_stage_mapping_method 
          CHECK (
            (start_stage_id IS NOT NULL AND end_stage_id IS NOT NULL) OR
            (start_stage IS NOT NULL AND end_stage IS NOT NULL)
          );
        `);
        console.log('   ✅ Successfully added constraint');
        
        // Add comments
        await pool.query(`
          COMMENT ON COLUMN canonical_stage_mappings.start_stage_id IS 'Pipedrive stage ID for the start stage (preferred over start_stage)';
          COMMENT ON COLUMN canonical_stage_mappings.end_stage_id IS 'Pipedrive stage ID for the end stage (preferred over end_stage)';
        `);
        console.log('   ✅ Successfully added comments');
        
      } catch (error) {
        console.log('   ❌ Error adding columns:', error.message);
      }
    } else {
      console.log('   ✅ Stage ID columns exist:');
      stageIdColumns.forEach(row => {
        console.log(`      - ${row.column_name}: ${row.data_type}`);
      });
    }

    // Test the columns work
    console.log('\n6. Testing column functionality...');
    try {
      const testResult = await pool.query(`
        SELECT start_stage_id, end_stage_id 
        FROM canonical_stage_mappings 
        LIMIT 1;
      `);
      console.log('   ✅ Columns are accessible');
    } catch (error) {
      console.log('   ❌ Error accessing columns:', error.message);
    }

  } catch (error) {
    console.error('❌ Error debugging migration:', error.message);
  } finally {
    await pool.end();
  }
}

debugMigration17();
