#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function setupTestDatabase() {
  console.log('🔧 Setting up test database with production tables...');
  
  try {
    // Create request status enum
    await sql`
      DO $$ BEGIN
        CREATE TYPE request_status AS ENUM ('draft','submitted','failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('✅ Created request_status enum');

    // Create requests table
    await sql`
      CREATE TABLE IF NOT EXISTS requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id TEXT UNIQUE,
        status request_status NOT NULL DEFAULT 'draft',
        salesperson_first_name TEXT,
        salesperson_selection TEXT CHECK (salesperson_selection IN ('Luyanda', 'James', 'Stefan')),
        mine_group TEXT,
        mine_name TEXT,
        contact JSONB,
        line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
        comment TEXT,
        pipedrive_deal_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    console.log('✅ Created requests table');

    // Create site_visits table
    await sql`
      CREATE TABLE IF NOT EXISTS site_visits (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        salesperson TEXT NOT NULL,
        planned_mines TEXT[] NOT NULL,
        main_purpose TEXT NOT NULL,
        availability TEXT NOT NULL,
        comments TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('✅ Created site_visits table');

    // Create pipedrive_deal_flow_data table
    await sql`
      CREATE TABLE IF NOT EXISTS pipedrive_deal_flow_data (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        pipedrive_event_id BIGINT UNIQUE NOT NULL,
        deal_id BIGINT NOT NULL,
        pipeline_id BIGINT NOT NULL,
        stage_id BIGINT NOT NULL,
        stage_name TEXT NOT NULL,
        entered_at TIMESTAMPTZ NOT NULL,
        left_at TIMESTAMPTZ,
        duration_seconds BIGINT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✅ Created pipedrive_deal_flow_data table');

    // Create pipedrive_metric_data table
    await sql`
      CREATE TABLE IF NOT EXISTS pipedrive_metric_data (
        id BIGINT PRIMARY KEY,
        title TEXT NOT NULL,
        pipeline_id BIGINT NOT NULL,
        stage_id BIGINT NOT NULL,
        status TEXT NOT NULL,
        first_fetched_at TIMESTAMPTZ DEFAULT NOW(),
        last_fetched_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✅ Created pipedrive_metric_data table');

    // Create canonical_stage_mappings table
    await sql`
      CREATE TABLE IF NOT EXISTS canonical_stage_mappings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        pipedrive_stage_id BIGINT NOT NULL,
        canonical_stage_name TEXT NOT NULL,
        pipeline_id BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(pipedrive_stage_id, pipeline_id)
      );
    `;
    console.log('✅ Created canonical_stage_mappings table');



    // Create indexes for requests table
    await sql`CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_requests_salesperson ON requests(salesperson_selection)`;
    console.log('✅ Created indexes for requests table');

    // Create indexes for site_visits table
    await sql`CREATE INDEX IF NOT EXISTS idx_site_visits_date ON site_visits(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_site_visits_salesperson ON site_visits(salesperson)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at)`;
    console.log('✅ Created indexes for site_visits table');

    // Create indexes for pipedrive tables
    await sql`CREATE INDEX IF NOT EXISTS idx_pdfd_deal_id ON pipedrive_deal_flow_data(deal_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pdfd_entered_at ON pipedrive_deal_flow_data(entered_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pdfd_stage_id ON pipedrive_deal_flow_data(stage_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pdfd_created_at ON pipedrive_deal_flow_data(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pdfd_pipedrive_event_id ON pipedrive_deal_flow_data(pipedrive_event_id)`;
    console.log('✅ Created indexes for pipedrive tables');

    // Create functions
    await sql`
      CREATE OR REPLACE FUNCTION generate_request_id()
      RETURNS TRIGGER AS $$
      DECLARE
          next_num INTEGER;
      BEGIN
          SELECT COALESCE(MAX(CAST(SUBSTRING(request_id FROM 4) AS INTEGER)), 0) + 1
          INTO next_num
          FROM requests
          WHERE request_id ~ '^QR-[0-9]+$';
          
          NEW.request_id := 'QR-' || LPAD(next_num::TEXT, 3, '0');
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    console.log('✅ Created generate_request_id function');

    await sql`
      CREATE OR REPLACE FUNCTION validate_contact_jsonb(contact_data JSONB)
      RETURNS BOOLEAN AS $$
      BEGIN
          RETURN contact_data ? 'personId' 
             AND contact_data ? 'name'
             AND contact_data ? 'mineGroup'
             AND contact_data ? 'mineName';
      END;
      $$ LANGUAGE plpgsql;
    `;
    console.log('✅ Created validate_contact_jsonb function');

    await sql`
      CREATE OR REPLACE FUNCTION set_updated_at() 
      RETURNS TRIGGER AS $$
      BEGIN 
          NEW.updated_at = now(); 
          RETURN NEW; 
      END; 
      $$ LANGUAGE plpgsql;
    `;
    console.log('✅ Created set_updated_at function');

    // Create triggers
    await sql`DROP TRIGGER IF EXISTS trg_generate_request_id ON requests`;
    await sql`CREATE TRIGGER trg_generate_request_id BEFORE INSERT ON requests FOR EACH ROW WHEN (NEW.request_id IS NULL) EXECUTE FUNCTION generate_request_id()`;
    console.log('✅ Created request_id trigger');

    await sql`DROP TRIGGER IF EXISTS trg_requests_updated ON requests`;
    await sql`CREATE TRIGGER trg_requests_updated BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION set_updated_at()`;
    console.log('✅ Created requests updated_at trigger');

    await sql`DROP TRIGGER IF EXISTS trigger_update_site_visits_updated_at ON site_visits`;
    await sql`CREATE TRIGGER trigger_update_site_visits_updated_at BEFORE UPDATE ON site_visits FOR EACH ROW EXECUTE FUNCTION set_updated_at()`;
    console.log('✅ Created site_visits updated_at trigger');

    await sql`DROP TRIGGER IF EXISTS trigger_update_pipedrive_deal_flow_data_updated_at ON pipedrive_deal_flow_data`;
    await sql`CREATE TRIGGER trigger_update_pipedrive_deal_flow_data_updated_at BEFORE UPDATE ON pipedrive_deal_flow_data FOR EACH ROW EXECUTE FUNCTION set_updated_at()`;
    console.log('✅ Created pipedrive_deal_flow_data updated_at trigger');

    // Add constraints
    await sql`ALTER TABLE site_visits ADD CONSTRAINT check_salesperson_valid CHECK (salesperson IN ('James', 'Luyanda', 'Stefan'))`;
    await sql`ALTER TABLE site_visits ADD CONSTRAINT check_purpose_valid CHECK (main_purpose IN ('Quote follow-up', 'Delivery', 'Site check', 'Installation support', 'General sales visit'))`;
    await sql`ALTER TABLE site_visits ADD CONSTRAINT check_availability_valid CHECK (availability IN ('Later this morning', 'In the afternoon', 'Tomorrow'))`;
    console.log('✅ Added constraints to site_visits table');

    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name NOT IN ('migrations', 'schema_migrations', 'test_table')
      ORDER BY table_name
    `;
    
    console.log('\n📋 Created tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    console.log('\n✅ Test database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up test database:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

setupTestDatabase();
