#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');

config({ path: '.env.local' });

async function resetTestMigrations() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const sql = neon(connectionString);

  try {
    console.log('🔄 Resetting test migrations...');
    
    // Remove migration records
    await sql`DELETE FROM schema_migrations WHERE version IN (22, 23)`;
    console.log('✅ Removed migration records for versions 22 and 23');
    
    // Drop test tables if they exist
    await sql`DROP TABLE IF EXISTS migration_test_table`;
    await sql`DROP TABLE IF EXISTS test_error_table`;
    console.log('✅ Dropped test tables if they existed');
    
    console.log('✅ Reset complete');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
  }
}

resetTestMigrations();
