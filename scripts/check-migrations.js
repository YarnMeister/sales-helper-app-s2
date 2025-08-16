#!/usr/bin/env node

const { Pool } = require('pg');
const { config } = require('dotenv');

// Load environment variables
config({ path: require('path').resolve(process.cwd(), '.env.local') });
config({ path: require('path').resolve(process.cwd(), '.env') });

async function checkMigrations() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Checking migration status...\n');

    // Check if migrations table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'schema_migrations'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ schema_migrations table does not exist');
      return;
    }

    // Get executed migrations
    const { rows: executed } = await pool.query(
      'SELECT version, name, executed_at FROM schema_migrations ORDER BY version'
    );

    console.log('📋 Applied Migrations:');
    if (executed.length === 0) {
      console.log('   No migrations applied yet');
    } else {
      executed.forEach(row => {
        console.log(`   ${row.version}: ${row.name} (${row.executed_at})`);
      });
    }

    // Check available migration files
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log('\n📁 Available Migration Files:');
    files.forEach(file => {
      const version = parseInt(file.split('_')[0]);
      const name = file.replace(/^\d+_/, '').replace(/\.sql$/, '');
      const applied = executed.some(row => row.version === version);
      console.log(`   ${version}: ${name} ${applied ? '✅' : '⏳'}`);
    });

  } catch (error) {
    console.error('❌ Error checking migrations:', error.message);
  } finally {
    await pool.end();
  }
}

checkMigrations();
