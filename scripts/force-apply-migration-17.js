const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function forceApplyMigration17() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Force applying migration 17...\n');

    // Remove migration 17 from tracking table
    console.log('1. Removing migration 17 from tracking table...');
    await pool.query(`
      DELETE FROM migrations 
      WHERE id = 17 OR name = 'stage_id_mappings'
    `);
    console.log('   ✅ Removed migration 17 tracking entry');

    // Read and execute the migration SQL
    console.log('\n2. Reading migration file...');
    const migrationPath = path.join(__dirname, '../migrations/017_stage_id_mappings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('   ✅ Migration file read');

    // Execute the migration
    console.log('\n3. Executing migration SQL...');
    await pool.query(migrationSQL);
    console.log('   ✅ Migration SQL executed');

    // Add migration to tracking table
    console.log('\n4. Adding migration to tracking table...');
    await pool.query(`
      INSERT INTO migrations (id, name, applied_at)
      VALUES (17, 'stage_id_mappings', NOW())
    `);
    console.log('   ✅ Migration added to tracking table');

    // Verify the columns exist
    console.log('\n5. Verifying columns were created...');
    const columnCheckQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'canonical_stage_mappings' 
      AND column_name IN ('start_stage_id', 'end_stage_id')
      ORDER BY column_name;
    `;

    const columnResult = await pool.query(columnCheckQuery);
    
    if (columnResult.rows.length === 0) {
      console.log('   ❌ Stage ID columns still do not exist!');
      return false;
    }

    console.log('   ✅ Stage ID columns created:');
    columnResult.rows.forEach(row => {
      console.log(`      - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n🎉 Migration 17 successfully force-applied!');
    return true;

  } catch (error) {
    console.error('❌ Error force-applying migration 17:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

forceApplyMigration17().then(success => {
  process.exit(success ? 0 : 1);
});
