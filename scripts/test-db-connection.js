#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connections...\n');

  // Test current database (should be test database in development)
  try {
    console.log('🧪 Testing CURRENT database (should be test DB in development)...');
    console.log('   Connection string format check...');
    
    const currentSql = neon(process.env.DATABASE_URL);
    const currentResult = await currentSql`SELECT 1 as test, 'current' as env`;
    console.log('✅ Current database connection successful');
    console.log('   Result:', currentResult[0]);
  } catch (error) {
    console.log('❌ Current database connection failed:', error.message);
    console.log('   Please check your DATABASE_URL format in .env.local');
    console.log('   Expected format: postgresql://user:password@host/dbname?sslmode=require');
  }

  console.log('\n🎯 Environment variables:');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('   Current DATABASE_URL points to:', process.env.DATABASE_URL?.includes('test-db') ? 'Test Database' : 'Production Database');
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testDatabaseConnection().catch(console.error);
