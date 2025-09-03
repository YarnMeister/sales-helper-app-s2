#!/usr/bin/env node

/**
 * Cleanup script to remove the test table
 * Run this when you're done testing the migration system
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../.env.local') });
config({ path: path.join(__dirname, '../.env') });

const sql = neon(process.env.DATABASE_URL);

async function cleanupTestTable() {
  console.log('🧹 Starting test table cleanup...');
  
  try {
    // Check if test table exists
    console.log('🔍 Checking if test table exists...');
    const existingTable = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'test_table'
    `;
    
    if (existingTable.length === 0) {
      console.log('✅ Test table does not exist, nothing to clean up');
      return;
    }
    
    // Drop the test table
    console.log('🗑️  Dropping test table...');
    await sql`DROP TABLE IF EXISTS test_table CASCADE`;
    console.log('✅ Test table dropped successfully');
    
    // Verify it's gone
    console.log('🔍 Verifying cleanup...');
    const verifyResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'test_table'
    `;
    
    if (verifyResult.length === 0) {
      console.log('✅ Cleanup verification successful - test table no longer exists');
    } else {
      throw new Error('Test table still exists after cleanup');
    }
    
    console.log('\n🎉 Test table cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanupTestTable().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
