#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');

// Load environment variables from .env.local first, then .env
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function runMigrations() {
  // Use unpooled connection for migrations to avoid pgbouncer limitations
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Running database migrations...\n');

    // Ensure migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Get executed migrations
    const { rows: executed } = await pool.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    const executedVersions = new Set(executed.map(row => row.version));

    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      const version = parseInt(file.split('_')[0]);
      const name = file.replace(/^\d+_/, '').replace(/\.sql$/, '');

      if (executedVersions.has(version)) {
        console.log(`⏭️  Migration ${version} (${name}) already applied`);
        continue;
      }

      console.log(`📝 Applying migration ${version}: ${name}`);

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute migration in a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
          [version, name]
        );
        await client.query('COMMIT');
        
        console.log(`✅ Migration ${version} applied successfully`);
        appliedCount++;
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    if (appliedCount === 0) {
      console.log('✨ Database is up to date');
    } else {
      console.log(`\n🎉 Applied ${appliedCount} migrations successfully`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
