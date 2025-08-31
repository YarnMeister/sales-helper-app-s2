#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');

config({ path: '.env.local' });

async function resetTestMigration() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const sql = neon(connectionString);

  try {
    console.log('🔄 Resetting test migration...');
    
    // Remove migration record
    await sql`DELETE FROM schema_migrations WHERE version = 22`;
    console.log('✅ Removed migration record for version 22');
    
    // Drop test table if it exists
    await sql`DROP TABLE IF EXISTS migration_test_table`;
    console.log('✅ Dropped migration_test_table if it existed');
    
    console.log('✅ Reset complete');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
  }
}

resetTestMigration();
