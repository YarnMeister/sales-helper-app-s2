#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function checkTestTable() {
  try {
    console.log('🔍 Checking if migration_test_table exists...');
    
    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migration_test_table'
      )
    `;
    
    if (tableExists[0].exists) {
      console.log('✅ migration_test_table exists');
      
      // Check if it has data
      const data = await sql`SELECT * FROM migration_test_table`;
      console.log('📋 Table data:', data);
    } else {
      console.log('❌ migration_test_table does NOT exist');
    }
    
    // Check migration record
    const migrationRecord = await sql`
      SELECT * FROM schema_migrations WHERE version = 22
    `;
    console.log('📋 Migration record for version 22:', migrationRecord);
    
  } catch (error) {
    console.error('❌ Error checking test table:', error);
  }
}

checkTestTable();
