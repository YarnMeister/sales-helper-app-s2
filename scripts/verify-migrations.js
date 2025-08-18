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

    // Check for expected tables based on migrations
    const expectedTables = [
      'requests',
      'mock_requests', 
      'site_visits',
      'mock_site_visits',
      'mock_pipedrive_submissions'
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

    // Check for specific issues with mock tables
    const mockRequestsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'mock_requests'
      )
    `;
    
    const mockSiteVisitsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'mock_site_visits'
      )
    `;

    console.log('\n🎯 Mock Tables Status:');
    console.log(`  ${mockRequestsExists[0].exists ? '✅' : '❌'} mock_requests`);
    console.log(`  ${mockSiteVisitsExists[0].exists ? '✅' : '❌'} mock_site_visits`);

    if (!mockRequestsExists[0].exists || !mockSiteVisitsExists[0].exists) {
      console.log('\n🔧 Attempting to fix missing tables...');
      
      // Read and execute the migration manually
      const migrationPath = path.join(__dirname, '..', 'migrations', '007_create_mock_tables.sql');
      if (fs.existsSync(migrationPath)) {
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        
        try {
          console.log('📝 Manually executing migration 007...');
          await sql.unsafe(migrationSql);
          console.log('✅ Manual migration execution successful');
          
          // Verify tables exist now
          const mockRequestsExistsAfter = await sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'mock_requests'
            )
          `;
          
          const mockSiteVisitsExistsAfter = await sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'mock_site_visits'
            )
          `;
          
          console.log('\n🎯 Mock Tables Status (after fix):');
          console.log(`  ${mockRequestsExistsAfter[0].exists ? '✅' : '❌'} mock_requests`);
          console.log(`  ${mockSiteVisitsExistsAfter[0].exists ? '✅' : '❌'} mock_site_visits`);
          
        } catch (error) {
          console.error('❌ Manual migration execution failed:', error.message);
          console.error('Full error:', error);
        }
      } else {
        console.error('❌ Migration file 007_create_mock_tables.sql not found');
      }
    }

    console.log('\n✨ Migration verification complete');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

verifyMigrations();
