const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');

// Load environment variables from .env.local first, then .env
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function fixMigration17() {
  // Use unpooled connection for migrations to avoid pgbouncer limitations
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not set');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('🔧 Fixing migration 17...\n');

    // Remove migration 17 from tracking
    console.log('1. Removing migration 17 from tracking table...');
    await sql`DELETE FROM schema_migrations WHERE version = 17`;
    console.log('   ✅ Removed migration 17 from tracking');

    // Read and execute migration 17
    console.log('\n2. Reading migration 17 file...');
    const migrationPath = path.join(__dirname, '../migrations/017_stage_id_mappings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('   ✅ Migration file read');

    // Execute the migration
    console.log('\n3. Executing migration 17...');
    await sql.unsafe(migrationSQL);
    console.log('   ✅ Migration SQL executed');

    // Add to tracking table
    console.log('\n4. Adding migration to tracking table...');
    await sql`INSERT INTO schema_migrations (version, name) VALUES (17, 'stage_id_mappings')`;
    console.log('   ✅ Migration added to tracking table');

    // Verify columns exist
    console.log('\n5. Verifying columns were created...');
    const columnsResult = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'canonical_stage_mappings' 
      AND column_name IN ('start_stage_id', 'end_stage_id')
      ORDER BY column_name;
    `;

    if (columnsResult.length === 0) {
      console.log('   ❌ Stage ID columns still do not exist!');
      return false;
    }

    console.log('   ✅ Stage ID columns created:');
    columnsResult.forEach(row => {
      console.log(`      - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Test the columns work
    console.log('\n6. Testing column functionality...');
    await sql`SELECT start_stage_id, end_stage_id FROM canonical_stage_mappings LIMIT 1`;
    console.log('   ✅ Columns are accessible');

    console.log('\n🎉 Migration 17 successfully fixed!');
    return true;

  } catch (error) {
    console.error('❌ Error fixing migration 17:', error.message);
    return false;
  }
}

fixMigration17().then(success => {
  process.exit(success ? 0 : 1);
});
