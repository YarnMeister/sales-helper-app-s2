#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');

config({ path: '.env.local' });

async function testUnsafeErrorHandling() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const sql = neon(connectionString);

  try {
    console.log('🧪 Testing sql.unsafe() error handling...\n');

    // Test 1: Direct SQL that should fail
    console.log('Test 1: Direct SQL with error');
    try {
      await sql`SELECT * FROM non_existent_table`;
      console.log('❌ Test 1 should have failed but succeeded');
    } catch (error) {
      console.log('✅ Test 1 correctly failed:', error.message);
    }

    // Test 2: sql.unsafe() with error
    console.log('\nTest 2: sql.unsafe() with error');
    try {
      await sql.unsafe('SELECT * FROM non_existent_table');
      console.log('❌ Test 2 should have failed but succeeded');
    } catch (error) {
      console.log('✅ Test 2 correctly failed:', error.message);
    }

    // Test 3: sql.unsafe() with division by zero
    console.log('\nTest 3: sql.unsafe() with division by zero');
    try {
      await sql.unsafe('SELECT 1/0');
      console.log('❌ Test 3 should have failed but succeeded');
    } catch (error) {
      console.log('✅ Test 3 correctly failed:', error.message);
    }

    // Test 4: sql.unsafe() with multiple statements where last one fails
    console.log('\nTest 4: sql.unsafe() with multiple statements, last one fails');
    try {
      await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS test_multiple (id SERIAL PRIMARY KEY);
        SELECT * FROM non_existent_table;
      `);
      console.log('❌ Test 4 should have failed but succeeded');
    } catch (error) {
      console.log('✅ Test 4 correctly failed:', error.message);
    }

    // Test 5: Check if test_multiple table was created
    console.log('\nTest 5: Checking if test_multiple table was created');
    const tableExists = await sql`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'test_multiple')
    `;
    console.log('test_multiple exists:', tableExists[0].exists);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUnsafeErrorHandling();
