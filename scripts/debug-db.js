#!/usr/bin/env node

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

const { neon } = require('@neondatabase/serverless');

async function debugDatabase() {
  console.log('=== Database Diagnostic ===\n');

  // Use unpooled connection for diagnostics
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not set');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('1. Testing database connection...');
    const connectionTest = await sql`SELECT 1 as test`;
    console.log('   ✅ Database connection successful');

    console.log('\n2. Checking site_visits table structure...');
    const tableInfo = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'site_visits' 
      ORDER BY ordinal_position
    `;
    
    console.log('   Columns in site_visits table:');
    tableInfo.forEach(col => {
      console.log(`     ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
    });

    console.log('\n3. Checking for submit_mode column specifically...');
    const submitModeCheck = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'site_visits' 
      AND column_name = 'submit_mode'
    `;
    
    if (submitModeCheck.length > 0) {
      console.log('   ✅ submit_mode column exists:');
      console.log(`     ${submitModeCheck[0].column_name}: ${submitModeCheck[0].data_type}${submitModeCheck[0].is_nullable === 'NO' ? ' NOT NULL' : ''}${submitModeCheck[0].column_default ? ` DEFAULT ${submitModeCheck[0].column_default}` : ''}`);
    } else {
      console.log('   ❌ submit_mode column does NOT exist');
    }

    console.log('\n4. Testing INSERT with submit_mode...');
    try {
      const testInsert = await sql`
        INSERT INTO site_visits (
          salesperson, 
          planned_mines, 
          main_purpose, 
          availability, 
          submit_mode
        ) VALUES (
          'Test User',
          ARRAY['Test Mine'],
          'Testing submit_mode column',
          'Test availability',
          'mock'
        ) RETURNING id, submit_mode
      `;
      
      console.log('   ✅ INSERT with submit_mode successful:');
      console.log(`     Inserted record ID: ${testInsert[0].id}`);
      console.log(`     submit_mode value: ${testInsert[0].submit_mode}`);
      
      // Clean up test record
      await sql`DELETE FROM site_visits WHERE id = ${testInsert[0].id}`;
      console.log('   ✅ Test record cleaned up');
      
    } catch (insertError) {
      console.log('   ❌ INSERT with submit_mode failed:');
      console.log(`     Error: ${insertError.message}`);
    }

    console.log('\n5. Checking existing records...');
    const existingRecords = await sql`
      SELECT id, salesperson, submit_mode, created_at 
      FROM site_visits 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    console.log(`   Found ${existingRecords.length} existing records:`);
    existingRecords.forEach(record => {
      console.log(`     ID: ${record.id}, Salesperson: ${record.salesperson}, submit_mode: ${record.submit_mode || 'NULL'}, Created: ${record.created_at}`);
    });

  } catch (error) {
    console.error('❌ Database diagnostic failed:', error.message);
    process.exit(1);
  }
}

debugDatabase().catch(console.error);
