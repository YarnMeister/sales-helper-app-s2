#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function reset() {
  const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
  
  console.log('Dropping flow_metrics table and all dependencies...');
  
  try {
    await sql.query('DROP TABLE IF EXISTS flow_metrics CASCADE');
    console.log('✅ Table dropped successfully');
    
    // Verify it's gone
    const check = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'flow_metrics')`;
    console.log('Table exists?', check[0].exists);
    
    console.log('\nTable dropped. Now Drizzle will recreate it with the correct schema.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

reset();
