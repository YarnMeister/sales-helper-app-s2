#!/usr/bin/env node

const { Pool } = require('pg');
const { config } = require('dotenv');

// Load environment variables
config({ path: require('path').resolve(process.cwd(), '.env.local') });
config({ path: require('path').resolve(process.cwd(), '.env') });

async function resetMigrations() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Resetting migrations...\n');

    // Check for duplicate entries
    const { rows: duplicates } = await pool.query(`
      SELECT version, COUNT(*) as count
      FROM schema_migrations 
      GROUP BY version 
      HAVING COUNT(*) > 1
    `);

    if (duplicates.length > 0) {
      console.log('⚠️  Found duplicate migration entries:');
      duplicates.forEach(row => {
        console.log(`   Version ${row.version}: ${row.count} entries`);
      });

      // Remove duplicates, keeping only the first one
      for (const dup of duplicates) {
        await pool.query(`
          DELETE FROM schema_migrations 
          WHERE version = $1 
          AND ctid NOT IN (
            SELECT MIN(ctid) 
            FROM schema_migrations 
            WHERE version = $1
          )
        `, [dup.version]);
        console.log(`✅ Removed ${dup.count - 1} duplicate entries for version ${dup.version}`);
      }
    } else {
      console.log('✅ No duplicate entries found');
    }

    // Show final state
    const { rows: final } = await pool.query(
      'SELECT version, name, executed_at FROM schema_migrations ORDER BY version'
    );

    console.log('\n📋 Final Migration State:');
    if (final.length === 0) {
      console.log('   No migrations applied');
    } else {
      final.forEach(row => {
        console.log(`   ${row.version}: ${row.name} (${row.executed_at})`);
      });
    }

  } catch (error) {
    console.error('❌ Error resetting migrations:', error.message);
  } finally {
    await pool.end();
  }
}

resetMigrations();
