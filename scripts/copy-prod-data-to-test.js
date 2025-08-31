#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

// Database URLs
const PROD_DB_URL = 'postgresql://neondb_owner:npg_4IuSMeiaL3sH@ep-fancy-lab-ab6x14x4-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const TEST_DB_URL = process.env.DATABASE_URL;

if (!TEST_DB_URL) {
  console.error('❌ TEST_DB_URL not found in environment variables');
  process.exit(1);
}

const prodSql = neon(PROD_DB_URL);
const testSql = neon(TEST_DB_URL);

const TABLES_TO_COPY = [
  'canonical_stage_mappings',
  'flow_metrics_config', 
  'pipedrive_deal_flow_data'
];

async function copyTableData(tableName) {
  try {
    console.log(`📋 Copying data from ${tableName}...`);
    
    // Get data from production
    const prodData = await prodSql`SELECT * FROM ${prodSql(tableName)}`;
    
    if (prodData.length === 0) {
      console.log(`⚠️  No data found in production ${tableName}`);
      return;
    }
    
    console.log(`📥 Found ${prodData.length} rows in production ${tableName}`);
    
    // Clear existing data in test database
    await testSql`DELETE FROM ${testSql(tableName)}`;
    console.log(`🗑️  Cleared existing data in test ${tableName}`);
    
    // Insert data into test database
    if (prodData.length > 0) {
      // Get column names from first row
      const columns = Object.keys(prodData[0]);
      const columnList = columns.join(', ');
      
      // Build the insert query dynamically
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const insertQuery = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`;
      
      // Insert each row
      for (const row of prodData) {
        const values = columns.map(col => row[col]);
        await testSql.unsafe(insertQuery, ...values);
      }
      
      console.log(`✅ Copied ${prodData.length} rows to test ${tableName}`);
    }
    
  } catch (error) {
    console.error(`❌ Error copying ${tableName}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔄 Starting data copy from production to test database...\n');
    
    // Test connections
    console.log('🔍 Testing database connections...');
    await prodSql`SELECT 1 as test`;
    await testSql`SELECT 1 as test`;
    console.log('✅ Database connections successful\n');
    
    // Copy each table
    for (const tableName of TABLES_TO_COPY) {
      await copyTableData(tableName);
      console.log(''); // Empty line for readability
    }
    
    console.log('🎉 Data copy completed successfully!');
    
    // Verify the copy
    console.log('\n🔍 Verifying copied data...');
    for (const tableName of TABLES_TO_COPY) {
      const count = await testSql`SELECT COUNT(*) as count FROM ${testSql(tableName)}`;
      console.log(`📊 ${tableName}: ${count[0].count} rows`);
    }
    
  } catch (error) {
    console.error('❌ Data copy failed:', error.message);
    process.exit(1);
  }
}

main();
