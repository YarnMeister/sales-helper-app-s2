#!/usr/bin/env node

/**
 * Check the actual structure of the site_visits table
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

async function checkTableStructure() {
  console.log('🔍 Checking site_visits table structure...');
  
  try {
    // Get table structure
    const columnsResult = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'site_visits'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 site_visits table columns:');
    columnsResult.forEach(column => {
      console.log(`   - ${column.column_name}: ${column.data_type} ${column.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${column.column_default ? `[default: ${column.column_default}]` : ''}`);
    });
    
    // Check if we have the expected columns for check-ins
    const columnNames = columnsResult.map(row => row.column_name);
    const expectedColumns = ['salesperson', 'planned_mines', 'main_purpose', 'availability'];
    
    console.log('\n🎯 Checking for expected check-in columns:');
    expectedColumns.forEach(col => {
      if (columnNames.includes(col)) {
        console.log(`   ✅ ${col} - exists`);
      } else {
        console.log(`   ❌ ${col} - missing`);
      }
    });
    
    // Check if we have the old columns that should be gone
    const oldColumns = ['request_id', 'visit_date', 'salesperson_first_name', 'salesperson_selection', 'mine_group', 'mine_name'];
    console.log('\n🚫 Checking for old columns that should be removed:');
    oldColumns.forEach(col => {
      if (columnNames.includes(col)) {
        console.log(`   ⚠️  ${col} - still exists (should be removed)`);
      } else {
        console.log(`   ✅ ${col} - removed`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
    process.exit(1);
  }
}

// Run the check
checkTableStructure().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
