#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');

// Load environment variables from .env.local first, then .env
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function verifyMigrations() {
  // Use unpooled connection for migrations to avoid pgbouncer limitations
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not set');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('🔍 Verifying database migrations...\n');

    // Check if migrations table exists
    const migrationsTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      )
    `;
    
    if (!migrationsTable[0].exists) {
      console.error('❌ schema_migrations table does not exist - migrations have never been run');
      process.exit(1);
    }

    // Get executed migrations
    const executed = await sql`SELECT version, name FROM schema_migrations ORDER BY version`;
    console.log('📋 Executed migrations:');
    executed.forEach(migration => {
      console.log(`  - ${migration.version}: ${migration.name}`);
    });

    // Check for expected tables based on migrations (no more mock tables)
    const expectedTables = [
      'requests',
      'site_visits',
      'pipedrive_submissions',
      'flow_metrics_config',
      'canonical_stage_mappings',
      'pipedrive_deal_flow_data',
      'pipedrive_metric_data'
    ];

    console.log('\n🔍 Checking table existence:');
    
    for (const tableName of expectedTables) {
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )
      `;
      
      const status = tableExists[0].exists ? '✅' : '❌';
      console.log(`  ${status} ${tableName}`);
      
      if (!tableExists[0].exists) {
        console.error(`    ❌ Table ${tableName} is missing but should exist`);
      }
    }

    // Check for specific issues with flow metrics tables
    const flowMetricsConfigExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'flow_metrics_config'
      )
    `;
    
    const canonicalStageMappingsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'canonical_stage_mappings'
      )
    `;

    console.log('\n🎯 Flow Metrics Tables Status:');
    console.log(`  ${flowMetricsConfigExists[0].exists ? '✅' : '❌'} flow_metrics_config`);
    console.log(`  ${canonicalStageMappingsExists[0].exists ? '✅' : '❌'} canonical_stage_mappings`);

    console.log('\n✨ Migration verification complete');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

verifyMigrations();
