#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function listTables() {
  const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
  
  const tables = await sql`
    SELECT table_name, table_schema
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  
  console.log('All tables in public schema:');
  console.table(tables);
  
  // Check for flow_metrics specifically
  const flowTables = tables.filter(t => t.table_name.includes('flow_metric'));
  console.log('\nFlow metrics related tables:');
  console.table(flowTables);
}

listTables();
