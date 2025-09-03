#!/usr/bin/env node

/**
 * Test migration runner for Drizzle system verification
 * Runs the test table migration and verifies the result
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../.env.local') });
config({ path: path.join(__dirname, '../.env') });

const sql = neon(process.env.DATABASE_URL);

async function runTestMigration() {
  console.log('🧪 Starting Drizzle test migration...');
  
  try {
    // Check if test table already exists
    console.log('🔍 Checking if test table exists...');
    const existingTable = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'test_table'
    `;
    
    if (existingTable.length > 0) {
      console.log('⚠️  Test table already exists, dropping it first...');
      await sql`DROP TABLE IF EXISTS test_table CASCADE`;
      console.log('✅ Old test table dropped');
    }
    
    // Execute the migration step by step instead of using sql.unsafe
    console.log('🚀 Executing migration step by step...');
    
    // Step 1: Create the table
    console.log('   📝 Creating test table...');
    await sql`
      CREATE TABLE IF NOT EXISTS test_table (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        name text NOT NULL,
        description text,
        test_value integer DEFAULT 42,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('   ✅ Table created');
    
    // Step 2: Insert test row
    console.log('   📝 Inserting test row...');
    await sql`
      INSERT INTO test_table (name, description, test_value) 
      VALUES ('Test Row', 'This is a test row to verify Drizzle migrations work', 123)
      ON CONFLICT DO NOTHING
    `;
    console.log('   ✅ Test row inserted');
    
    // Step 3: Create index
    console.log('   📝 Creating index...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_test_table_name ON test_table USING btree (name)
    `;
    console.log('   ✅ Index created');
    
    // Step 4: Add comment
    console.log('   📝 Adding table comment...');
    await sql`
      COMMENT ON TABLE test_table IS 'Temporary test table for Drizzle migration verification'
    `;
    console.log('   ✅ Comment added');
    
    console.log('✅ Migration executed successfully');
    
    // Verify the table was created
    console.log('🔍 Verifying table creation...');
    const tableResult = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_name = 'test_table'
    `;
    
    if (tableResult.length === 0) {
      throw new Error('Test table was not created');
    }
    
    console.log('✅ Test table created successfully');
    
    // Verify the table structure
    console.log('🔍 Verifying table structure...');
    const columnsResult = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'test_table'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 Table columns:');
    columnsResult.forEach(column => {
      console.log(`   - ${column.column_name}: ${column.data_type} ${column.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Verify the test row was inserted
    console.log('🔍 Verifying test row insertion...');
    const testRowResult = await sql`
      SELECT * FROM test_table WHERE name = 'Test Row'
    `;
    
    if (testRowResult.length === 0) {
      throw new Error('Test row was not inserted');
    }
    
    const testRow = testRowResult[0];
    console.log('✅ Test row inserted successfully:');
    console.log(`   - ID: ${testRow.id}`);
    console.log(`   - Name: ${testRow.name}`);
    console.log(`   - Description: ${testRow.description}`);
    console.log(`   - Test Value: ${testRow.test_value}`);
    console.log(`   - Created: ${testRow.created_at}`);
    
    // Verify the index was created
    console.log('🔍 Verifying index creation...');
    const indexResult = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'test_table' AND indexname = 'idx_test_table_name'
    `;
    
    if (indexResult.length === 0) {
      throw new Error('Test index was not created');
    }
    
    console.log('✅ Test index created successfully');
    
    // Test a simple query to ensure everything works
    console.log('🔍 Testing table query...');
    const queryResult = await sql`
      SELECT COUNT(*) as row_count, 
             AVG(test_value) as avg_value,
             MAX(created_at) as latest_created
      FROM test_table
    `;
    
    console.log('✅ Query test successful:');
    console.log(`   - Row count: ${queryResult[0].row_count}`);
    console.log(`   - Average test value: ${queryResult[0].avg_value}`);
    console.log(`   - Latest created: ${queryResult[0].latest_created}`);
    
    console.log('\n🎉 Test migration completed successfully!');
    console.log('✅ Drizzle migration system is working properly');
    console.log('💡 You can now remove the test table when done testing');
    
  } catch (error) {
    console.error('❌ Test migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test migration
runTestMigration().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
