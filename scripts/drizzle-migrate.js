#!/usr/bin/env node

const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { migrate } = require('drizzle-orm/neon-http/migrator');
const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function runDrizzleMigrations() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not set');
    process.exit(1);
  }

  const sql = neon(connectionString);
  const db = drizzle(sql);

  try {
    console.log('🔄 Running Drizzle migrations...\n');
    
    // Run migrations using Drizzle's built-in migrator
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Drizzle migrations completed successfully');
    
  } catch (error) {
    console.error('❌ Drizzle migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runDrizzleMigrations();
