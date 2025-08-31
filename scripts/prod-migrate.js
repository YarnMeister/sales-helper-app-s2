#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function productionMigrate() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not set');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('🚀 Production Migration Check...\n');

    // Ensure we're in production environment
    if (process.env.APP_ENV !== 'production') {
      console.log('⚠️  Not in production environment, skipping migrations');
      return;
    }

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
      return;
    }

    console.log(`📝 Production database needs migrations (current: ${latestMigration}, expected: ${latestExpected})`);
    console.log('🔄 Running production Drizzle migrations...');

    // Import and run Drizzle migration
    const { drizzle } = require('drizzle-orm/neon-http');
    const { migrate } = require('drizzle-orm/neon-http/migrator');
    
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Production migrations completed successfully');

  } catch (error) {
    console.error('❌ Production migration failed:', error.message);
    console.error('Full error:', error);
    // In production, we want to fail fast if migrations don't work
    process.exit(1);
  }
}

productionMigrate();
