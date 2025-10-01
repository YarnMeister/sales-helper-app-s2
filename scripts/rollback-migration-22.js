#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function rollback() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const sql = neon(connectionString);

  console.log('Rolling back migration 22...');
  
  // Delete the migration record so it can be re-run
  await sql`DELETE FROM schema_migrations WHERE version = 22`;
  
  console.log('✅ Migration 22 rolled back - ready to re-run');
}

rollback();
