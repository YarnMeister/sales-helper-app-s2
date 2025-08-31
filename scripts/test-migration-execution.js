#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function testMigrationExecution() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const sql = neon(connectionString);

  try {
    console.log('🧪 Testing migration execution...\n');

    // Test 1: Direct SQL execution
    console.log('Test 1: Direct SQL execution');
    await sql`CREATE TABLE IF NOT EXISTS test_direct_sql (id SERIAL PRIMARY KEY, test_col TEXT)`;
    await sql`INSERT INTO test_direct_sql (test_col) VALUES ('direct_sql_works')`;
    const directResult = await sql`SELECT * FROM test_direct_sql`;
    console.log('✅ Direct SQL result:', directResult);

    // Test 2: sql.unsafe() execution
    console.log('\nTest 2: sql.unsafe() execution');
    const unsafeSql = `
      CREATE TABLE IF NOT EXISTS test_unsafe_sql (id SERIAL PRIMARY KEY, test_col TEXT);
      INSERT INTO test_unsafe_sql (test_col) VALUES ('unsafe_sql_works');
    `;
    
    try {
      await sql.unsafe(unsafeSql);
      const unsafeResult = await sql`SELECT * FROM test_unsafe_sql`;
      console.log('✅ sql.unsafe() result:', unsafeResult);
    } catch (error) {
      console.log('❌ sql.unsafe() failed:', error.message);
    }

    // Test 3: Transaction with sql.unsafe()
    console.log('\nTest 3: Transaction with sql.unsafe()');
    const transactionSql = `
      CREATE TABLE IF NOT EXISTS test_transaction_sql (id SERIAL PRIMARY KEY, test_col TEXT);
      INSERT INTO test_transaction_sql (test_col) VALUES ('transaction_sql_works');
    `;
    
    try {
      await sql`BEGIN`;
      await sql.unsafe(transactionSql);
      await sql`COMMIT`;
      
      const transactionResult = await sql`SELECT * FROM test_transaction_sql`;
      console.log('✅ Transaction with sql.unsafe() result:', transactionResult);
    } catch (error) {
      await sql`ROLLBACK`;
      console.log('❌ Transaction with sql.unsafe() failed:', error.message);
    }

    // Test 4: Read the actual migration file
    console.log('\nTest 4: Read and execute migration 22');
    const migrationPath = path.join(__dirname, '..', 'migrations', '022_test_migration_verification.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Migration SQL:', migrationSql);
    
    try {
      await sql`BEGIN`;
      await sql.unsafe(migrationSql);
      await sql`COMMIT`;
      console.log('✅ Migration 22 executed successfully');
    } catch (error) {
      await sql`ROLLBACK`;
      console.log('❌ Migration 22 failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMigrationExecution();
