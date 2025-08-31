#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');

config({ path: '.env.local' });

async function testTransactionHandling() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const sql = neon(connectionString);

  try {
    console.log('🧪 Testing transaction handling...\n');

    // Test 1: Simple transaction that should succeed
    console.log('Test 1: Simple successful transaction');
    try {
      await sql`BEGIN`;
      await sql`CREATE TABLE IF NOT EXISTS test_success (id SERIAL PRIMARY KEY)`;
      await sql`INSERT INTO test_success DEFAULT VALUES`;
      await sql`COMMIT`;
      console.log('✅ Test 1 succeeded');
    } catch (error) {
      await sql`ROLLBACK`;
      console.log('❌ Test 1 failed:', error.message);
    }

    // Test 2: Transaction that should fail
    console.log('\nTest 2: Transaction that should fail');
    try {
      await sql`BEGIN`;
      await sql`CREATE TABLE IF NOT EXISTS test_fail (id SERIAL PRIMARY KEY)`;
      await sql`SELECT * FROM non_existent_table`; // This should fail
      await sql`COMMIT`;
      console.log('❌ Test 2 should have failed but succeeded');
    } catch (error) {
      await sql`ROLLBACK`;
      console.log('✅ Test 2 correctly failed:', error.message);
    }

    // Test 3: Check if tables exist
    console.log('\nTest 3: Checking table existence');
    const successExists = await sql`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'test_success')
    `;
    const failExists = await sql`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'test_fail')
    `;
    
    console.log('test_success exists:', successExists[0].exists);
    console.log('test_fail exists:', failExists[0].exists);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTransactionHandling();
