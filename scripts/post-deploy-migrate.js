#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

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
    console.log('🚀 Post-Deployment Migration Check...\n');

    // Check if schema_migrations table exists and has the latest migrations
    const migrations = await sql`
      SELECT version, name FROM schema_migrations 
      ORDER BY version DESC
    `;

    const latestMigration = migrations.length > 0 ? migrations[0].version : -1;
    const expectedMigrations = [0, 1]; // Our Drizzle migrations
    const latestExpected = Math.max(...expectedMigrations);

    if (latestMigration >= latestExpected) {
      console.log('✅ Production database is up to date - no migrations needed');
      return { success: true, message: 'Database is up to date' };
    }

    console.log(`📝 Production database needs migrations (current: ${latestMigration}, expected: ${latestExpected})`);
    console.log('🔄 Running post-deployment Drizzle migrations...');

    // Import and run Drizzle migration
    const { drizzle } = require('drizzle-orm/neon-http');
    const { migrate } = require('drizzle-orm/neon-http/migrator');
    
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Post-deployment migrations completed successfully');
    return { success: true, message: 'Migrations completed successfully' };

  } catch (error) {
    console.error('❌ Post-deployment migration failed:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
}

// If run directly (not imported)
if (require.main === module) {
  postDeployMigrate()
    .then(result => {
      if (result.success) {
        console.log('✅ Migration completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Migration failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { postDeployMigrate };
