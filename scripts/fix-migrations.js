#!/usr/bin/env node

const { Pool } = require('pg');
const { config } = require('dotenv');

// Load environment variables
config({ path: require('path').resolve(process.cwd(), '.env.local') });
config({ path: require('path').resolve(process.cwd(), '.env') });

async function fixMigrations() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Fixing migration issue...\n');

    // Show all entries in schema_migrations
    const { rows: allEntries } = await pool.query(
      'SELECT version, name, executed_at FROM schema_migrations ORDER BY version'
    );

    console.log('📋 All Migration Entries:');
    allEntries.forEach(row => {
      console.log(`   Version ${row.version}: ${row.name} (${row.executed_at})`);
    });

    // Check if version 2 exists
    const { rows: version2 } = await pool.query(
      'SELECT version, name FROM schema_migrations WHERE version = 2'
    );

    if (version2.length > 0) {
      console.log(`\n⚠️  Version 2 already exists: ${version2[0].name}`);
      console.log('Removing version 2 entry to allow re-application...');
      
      await pool.query('DELETE FROM schema_migrations WHERE version = 2');
      console.log('✅ Removed version 2 entry');
    } else {
      console.log('\n✅ No version 2 entry found');
    }

    // Show final state
    const { rows: final } = await pool.query(
      'SELECT version, name FROM schema_migrations ORDER BY version'
    );

    console.log('\n📋 Final Migration State:');
    final.forEach(row => {
      console.log(`   ${row.version}: ${row.name}`);
    });

  } catch (error) {
    console.error('❌ Error fixing migrations:', error.message);
  } finally {
    await pool.end();
  }
}

fixMigrations();
