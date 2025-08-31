#!/usr/bin/env node

const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { migrate } = require('drizzle-orm/neon-http/migrator');
const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function runCompleteDrizzleMigrations() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED not set');
    process.exit(1);
  }

  const sql = neon(connectionString);
  const db = drizzle(sql);

  try {
    console.log('🔄 Running complete Drizzle migrations...\n');

    // Step 1: Drop mock tables (safe to run multiple times)
    console.log('📝 Step 1: Dropping mock tables...');
    try {
      await sql`DROP TABLE IF EXISTS mock_requests CASCADE`;
      await sql`DROP TABLE IF EXISTS mock_site_visits CASCADE`;
      await sql`DROP TABLE IF EXISTS mock_pipedrive_submissions CASCADE`;
      console.log('✅ Mock tables dropped successfully');
    } catch (error) {
      console.log('⚠️  Error dropping mock tables (may not exist):', error.message);
    }

    // Step 2: Run Drizzle migrations (tables and constraints)
    console.log('\n📝 Step 2: Running Drizzle migrations...');
    try {
      await migrate(db, { migrationsFolder: './drizzle' });
      console.log('✅ Drizzle migrations completed successfully');
    } catch (error) {
      console.log('⚠️  Drizzle migration error (may already be applied):', error.message);
    }

    // Step 3: Apply indexes
    console.log('\n📝 Step 3: Applying indexes...');
    const indexes = [
      // Requests indexes
      'CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests (created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_requests_salesperson ON requests (salesperson_selection)',
      'CREATE INDEX IF NOT EXISTS idx_requests_status ON requests (status)',
      
      // Site visits indexes
      'CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits (created_at)',
      'CREATE INDEX IF NOT EXISTS idx_site_visits_date ON site_visits (date)',
      'CREATE INDEX IF NOT EXISTS idx_site_visits_salesperson ON site_visits (salesperson)',
      
      // Flow metrics config indexes
      'CREATE INDEX IF NOT EXISTS idx_fmc_is_active ON flow_metrics_config (is_active)',
      'CREATE INDEX IF NOT EXISTS idx_fmc_metric_key ON flow_metrics_config (metric_key)',
      'CREATE INDEX IF NOT EXISTS idx_fmc_sort_order ON flow_metrics_config (sort_order)',
      
      // Canonical stage mappings indexes
      'CREATE INDEX IF NOT EXISTS idx_csm_canonical_stage ON canonical_stage_mappings (canonical_stage)',
      'CREATE INDEX IF NOT EXISTS idx_csm_start_stage ON canonical_stage_mappings (start_stage)',
      'CREATE INDEX IF NOT EXISTS idx_csm_end_stage ON canonical_stage_mappings (end_stage)',
      'CREATE INDEX IF NOT EXISTS idx_csm_start_stage_id ON canonical_stage_mappings (start_stage_id)',
      'CREATE INDEX IF NOT EXISTS idx_csm_end_stage_id ON canonical_stage_mappings (end_stage_id)',
      
      // Pipedrive deal flow data indexes
      'CREATE INDEX IF NOT EXISTS idx_pdfd_created_at ON pipedrive_deal_flow_data (created_at)',
      'CREATE INDEX IF NOT EXISTS idx_pdfd_deal_id ON pipedrive_deal_flow_data (deal_id)',
      'CREATE INDEX IF NOT EXISTS idx_pdfd_entered_at ON pipedrive_deal_flow_data (entered_at)',
      'CREATE INDEX IF NOT EXISTS idx_pdfd_pipedrive_event_id ON pipedrive_deal_flow_data (pipedrive_event_id)',
      'CREATE INDEX IF NOT EXISTS idx_pdfd_stage_id ON pipedrive_deal_flow_data (stage_id)',
    ];
    
    for (const index of indexes) {
      try {
        await sql.unsafe(index);
        console.log(`  ✅ Applied index: ${index.substring(0, 50)}...`);
      } catch (error) {
        console.log(`  ⚠️  Index may already exist: ${error.message}`);
      }
    }

    // Step 4: Apply column comments
    console.log('\n📝 Step 4: Applying column comments...');
    const comments = [
      "COMMENT ON COLUMN canonical_stage_mappings.canonical_stage IS 'The canonical stage name (e.g., Order Conversion)'",
      "COMMENT ON COLUMN canonical_stage_mappings.start_stage IS 'The Pipedrive stage name that marks the start of this canonical stage'",
      "COMMENT ON COLUMN canonical_stage_mappings.end_stage IS 'The Pipedrive stage name that marks the end of this canonical stage'",
      "COMMENT ON COLUMN canonical_stage_mappings.start_stage_id IS 'Pipedrive stage ID for the start stage (preferred over start_stage)'",
      "COMMENT ON COLUMN canonical_stage_mappings.end_stage_id IS 'Pipedrive stage ID for the end stage (preferred over end_stage)'",
      "COMMENT ON COLUMN canonical_stage_mappings.avg_min_days IS 'Minimum threshold in days for green color coding (excellent performance)'",
      "COMMENT ON COLUMN canonical_stage_mappings.avg_max_days IS 'Maximum threshold in days for red color coding (needs attention)'",
      "COMMENT ON COLUMN canonical_stage_mappings.metric_comment IS 'Narrative or interpretation about the current metric performance'",
      
      "COMMENT ON COLUMN pipedrive_deal_flow_data.deal_id IS 'Pipedrive deal ID'",
      "COMMENT ON COLUMN pipedrive_deal_flow_data.pipeline_id IS 'Pipedrive pipeline ID'",
      "COMMENT ON COLUMN pipedrive_deal_flow_data.stage_id IS 'Pipedrive stage ID'",
      "COMMENT ON COLUMN pipedrive_deal_flow_data.stage_name IS 'Human-readable stage name'",
      "COMMENT ON COLUMN pipedrive_deal_flow_data.entered_at IS 'When the deal entered this stage'",
      "COMMENT ON COLUMN pipedrive_deal_flow_data.left_at IS 'When the deal left this stage (NULL if still in stage)'",
      "COMMENT ON COLUMN pipedrive_deal_flow_data.duration_seconds IS 'Duration in seconds spent in this stage'",
      "COMMENT ON COLUMN pipedrive_deal_flow_data.pipedrive_event_id IS 'Unique Pipedrive event ID to prevent duplicates'",
    ];
    
    for (const comment of comments) {
      try {
        await sql.unsafe(comment);
        console.log(`  ✅ Applied comment: ${comment.substring(0, 50)}...`);
      } catch (error) {
        console.log(`  ⚠️  Comment may already exist: ${error.message}`);
      }
    }

    console.log('\n✅ Complete Drizzle migration system finished successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runCompleteDrizzleMigrations();
