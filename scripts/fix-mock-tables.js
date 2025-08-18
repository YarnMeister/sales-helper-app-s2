#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');

// Load environment variables from .env.local first, then .env
config({ path: '.env.local' });
config({ path: '.env' });

async function fixMockTables() {
  // Use unpooled connection for migrations to avoid pgbouncer limitations
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not set');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('🔧 Creating mock tables manually...\n');

    // Create mock_requests table step by step
    console.log('📝 Creating mock_requests table...');
    
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS mock_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          request_id VARCHAR(10) UNIQUE NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'failed')),
          salesperson_first_name VARCHAR(100),
          salesperson_selection VARCHAR(20) CHECK (salesperson_selection IN ('Luyanda', 'James', 'Stefan')),
          mine_group VARCHAR(200),
          mine_name VARCHAR(200),
          contact JSONB,
          line_items JSONB DEFAULT '[]'::jsonb,
          comment TEXT,
          pipedrive_deal_id INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      console.log('✅ mock_requests table created successfully');
    } catch (error) {
      console.error('❌ Failed to create mock_requests table:', error.message);
      throw error;
    }

    // Create indexes for mock_requests
    console.log('📝 Creating indexes for mock_requests...');
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_mock_requests_status ON mock_requests(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_mock_requests_salesperson ON mock_requests(salesperson_first_name)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_mock_requests_created_at ON mock_requests(created_at)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_mock_requests_request_id ON mock_requests(request_id)`;
      console.log('✅ mock_requests indexes created successfully');
    } catch (error) {
      console.error('❌ Failed to create mock_requests indexes:', error.message);
      throw error;
    }

    // Create mock_site_visits table
    console.log('📝 Creating mock_site_visits table...');
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS mock_site_visits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          date DATE DEFAULT CURRENT_DATE,
          salesperson VARCHAR(100) NOT NULL,
          planned_mines TEXT[] NOT NULL,
          main_purpose VARCHAR(100) NOT NULL,
          availability VARCHAR(50) NOT NULL,
          comments TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      console.log('✅ mock_site_visits table created successfully');
    } catch (error) {
      console.error('❌ Failed to create mock_site_visits table:', error.message);
      throw error;
    }

    // Create indexes for mock_site_visits
    console.log('📝 Creating indexes for mock_site_visits...');
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_mock_site_visits_date ON mock_site_visits(date)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_mock_site_visits_salesperson ON mock_site_visits(salesperson)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_mock_site_visits_created_at ON mock_site_visits(created_at)`;
      console.log('✅ mock_site_visits indexes created successfully');
    } catch (error) {
      console.error('❌ Failed to create mock_site_visits indexes:', error.message);
      throw error;
    }

    // Verify tables exist
    console.log('\n🔍 Verifying tables exist...');
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

    console.log(`  ${mockRequestsExists[0].exists ? '✅' : '❌'} mock_requests`);
    console.log(`  ${mockSiteVisitsExists[0].exists ? '✅' : '❌'} mock_site_visits`);

    if (mockRequestsExists[0].exists && mockSiteVisitsExists[0].exists) {
      console.log('\n🎉 Mock tables created successfully!');
    } else {
      console.log('\n❌ Some tables are still missing');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Failed to create mock tables:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

fixMockTables();
