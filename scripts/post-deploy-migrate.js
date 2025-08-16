#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function postDeployMigrate() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not set');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('🔄 Running post-deployment migrations...\n');

    // Ensure migrations table exists
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    // Get executed migrations
    const executed = await sql`SELECT version FROM schema_migrations ORDER BY version`;
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

      const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        await sql`BEGIN`;
        await sql.unsafe(migrationSql);
        await sql`INSERT INTO schema_migrations (version, name) VALUES (${version}, ${name})`;
        await sql`COMMIT`;
        
        console.log(`✅ Migration ${version} applied successfully`);
        appliedCount++;
        
      } catch (error) {
        await sql`ROLLBACK`;
        console.error(`❌ Migration ${version} failed:`, error.message);
        throw error;
      }
    }

    if (appliedCount === 0) {
      console.log('✨ Database is up to date');
    } else {
      console.log(`\n🎉 Applied ${appliedCount} migrations successfully`);
    }

  } catch (error) {
    console.error('❌ Post-deployment migration failed:', error.message);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  postDeployMigrate();
}

module.exports = { postDeployMigrate };
