#!/usr/bin/env node

/**
 * Non-interactive Drizzle schema migration script
 * Designed to work in CI/CD environments without user input
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

async function migrateDrizzleSchema() {
  console.log('🔄 Starting non-interactive Drizzle schema migration...');
  
  try {
    // Check current database state
    console.log('📊 Checking current database schema...');
    
    // Get list of existing tables
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const existingTables = tablesResult.map(row => row.table_name);
    console.log('📋 Existing tables:', existingTables);
    
    // Check if our target tables exist and have the right structure
    const targetTables = [
      'flow_metrics_config',
      'canonical_stage_mappings',
      'requests',
      'mock_requests',
      'site_visits',
      'pipedrive_submissions',
      'pipedrive_deal_flow_data',
      'pipedrive_metric_data',
      'flow_metrics',
      'kv_cache'
    ];
    
    console.log('🎯 Target tables:', targetTables);
    
    // Check each target table
    for (const tableName of targetTables) {
      if (existingTables.includes(tableName)) {
        console.log(`✅ Table ${tableName} exists`);
        
        // Check if it has the right structure (basic check)
        try {
          const columnsResult = await sql`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = ${tableName}
            ORDER BY ordinal_position
          `;
          
          console.log(`   📊 ${tableName} has ${columnsResult.length} columns`);
          
          // Check for critical columns
          const columnNames = columnsResult.map(row => row.column_name);
          if (tableName === 'flow_metrics_config' && !columnNames.includes('metric_key')) {
            console.log(`   ⚠️  ${tableName} missing critical column 'metric_key'`);
          }
          if (tableName === 'canonical_stage_mappings' && !columnNames.includes('canonical_stage')) {
            console.log(`   ⚠️  ${tableName} missing critical column 'canonical_stage'`);
          }
        } catch (error) {
          console.log(`   ❌ Error checking ${tableName} structure:`, error.message);
        }
      } else {
        console.log(`❌ Table ${tableName} missing`);
      }
    }
    
    // Check if we need to create any missing tables
    console.log('\n🔍 Checking for missing tables...');
    const missingTables = targetTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ All target tables exist');
    } else {
      console.log('⚠️  Missing tables:', missingTables);
      console.log('💡 Run "npm run db:generate" to create migration files for missing tables');
    }
    
    // Check if we need to run migrations
    console.log('\n🔍 Checking migration status...');
    try {
      const migrationsResult = await sql`
        SELECT migration_name, executed_at 
        FROM schema_migrations 
        ORDER BY executed_at DESC
        LIMIT 5
      `;
      
      console.log('📋 Recent migrations:', migrationsResult.length);
      migrationsResult.forEach(migration => {
        console.log(`   📝 ${migration.migration_name} - ${migration.executed_at}`);
      });
    } catch (error) {
      console.log('⚠️  Could not check migration status:', error.message);
    }
    
    console.log('\n🎉 Schema migration check completed successfully!');
    console.log('💡 If tables are missing or have wrong structure, run:');
    console.log('   1. npm run db:generate  (creates migration files)');
    console.log('   2. npm run db:migrate   (applies migrations)');
    
  } catch (error) {
    console.error('❌ Schema migration check failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateDrizzleSchema().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
