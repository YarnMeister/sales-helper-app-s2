const { Pool } = require('pg');
require('dotenv').config();

async function checkMigrationStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking migration status...\n');

    // Check migrations table
    const migrationsQuery = `
      SELECT * FROM migrations 
      WHERE name LIKE '%stage_id%' OR name LIKE '%017%'
      ORDER BY id;
    `;

    const migrationsResult = await pool.query(migrationsQuery);
    
    console.log('1. Migration records:');
    if (migrationsResult.rows.length === 0) {
      console.log('   ❌ No stage_id migration records found!');
    } else {
      migrationsResult.rows.forEach(row => {
        console.log(`   - ID: ${row.id}, Name: ${row.name}, Applied: ${row.applied_at}`);
      });
    }

    // Check if canonical_stage_mappings table exists
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'canonical_stage_mappings';
    `;

    const tableResult = await pool.query(tableCheckQuery);
    
    console.log('\n2. Table existence:');
    if (tableResult.rows.length === 0) {
      console.log('   ❌ canonical_stage_mappings table does not exist!');
      return;
    }
    console.log('   ✅ canonical_stage_mappings table exists');

    // Check all columns in the table
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'canonical_stage_mappings'
      ORDER BY ordinal_position;
    `;

    const columnsResult = await pool.query(columnsQuery);
    
    console.log('\n3. Table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check if stage ID columns exist
    const stageIdColumns = columnsResult.rows.filter(row => 
      row.column_name === 'start_stage_id' || row.column_name === 'end_stage_id'
    );

    console.log('\n4. Stage ID columns:');
    if (stageIdColumns.length === 0) {
      console.log('   ❌ Stage ID columns are missing!');
      console.log('   Expected: start_stage_id, end_stage_id');
    } else {
      stageIdColumns.forEach(row => {
        console.log(`   ✅ ${row.column_name}: ${row.data_type}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
  } finally {
    await pool.end();
  }
}

checkMigrationStatus();
