#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function debug() {
  const pooled = process.env.DATABASE_URL;
  const unpooled = process.env.DATABASE_URL_UNPOOLED;
  
  console.log('=== DATABASE CONNECTION INFO ===\n');
  console.log('DATABASE_URL (pooled):', pooled ? pooled.substring(0, 80) + '...' : 'NOT SET');
  console.log('DATABASE_URL_UNPOOLED:', unpooled ? unpooled.substring(0, 80) + '...' : 'NOT SET');
  
  // Connect with unpooled (what migrations use)
  const sql = neon(unpooled || pooled);
  
  try {
    // Get database identity
    const identity = await sql`
      SELECT 
        current_database() as database_name,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port,
        version() as pg_version
    `;
    console.log('\n=== CONNECTED TO ===');
    console.log(identity[0]);
    
    // Check if table exists and its structure
    const tableInfo = await sql`
      SELECT 
        table_name,
        table_schema
      FROM information_schema.tables 
      WHERE table_name = 'flow_metrics'
    `;
    console.log('\n=== TABLE flow_metrics ===');
    console.log(tableInfo.length > 0 ? tableInfo[0] : 'TABLE DOES NOT EXIST');
    
    // Get column info
    if (tableInfo.length > 0) {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'flow_metrics'
        ORDER BY ordinal_position
      `;
      console.log('\n=== COLUMNS ===');
      console.table(columns);
      
      // Count rows
      const count = await sql`SELECT COUNT(*) as count FROM flow_metrics`;
      console.log('\n=== ROW COUNT ===');
      console.log('Rows:', count[0].count);
      
      // Check constraints
      const constraints = await sql`
        SELECT 
          conname as constraint_name,
          pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = 'public.flow_metrics'::regclass
        AND contype = 'c'
      `;
      console.log('\n=== CHECK CONSTRAINTS ===');
      console.table(constraints);
    }
    
    // Check last migration
    const lastMigration = await sql`
      SELECT version, name, executed_at 
      FROM schema_migrations 
      ORDER BY version DESC 
      LIMIT 5
    `;
    console.log('\n=== LAST 5 MIGRATIONS ===');
    console.table(lastMigration);
    
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error);
  }
}

debug();
