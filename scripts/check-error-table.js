#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function checkErrorTable() {
  try {
    console.log('🔍 Checking if test_error_table exists...');
    
    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'test_error_table'
      )
    `;
    
    if (tableExists[0].exists) {
      console.log('✅ test_error_table exists');
    } else {
      console.log('❌ test_error_table does NOT exist');
    }
    
    // Check migration record
    const migrationRecord = await sql`
      SELECT * FROM schema_migrations WHERE version = 23
    `;
    console.log('📋 Migration record for version 23:', migrationRecord);
    
  } catch (error) {
    console.error('❌ Error checking error table:', error);
  }
}

checkErrorTable();
