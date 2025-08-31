require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function fixPipedriveDealFlowData() {
  try {
    console.log('🔧 Fixing pipedrive_deal_flow_data table schema...');
    
    // Drop the existing table
    await sql`DROP TABLE IF EXISTS pipedrive_deal_flow_data CASCADE`;
    console.log('🗑️  Dropped existing pipedrive_deal_flow_data table');
    
    // Create the table with the correct schema (matching production)
    await sql`
      CREATE TABLE pipedrive_deal_flow_data (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        deal_id BIGINT NOT NULL,
        pipeline_id BIGINT NOT NULL,
        stage_id BIGINT NOT NULL,
        stage_name TEXT NOT NULL,
        entered_at TIMESTAMPTZ NOT NULL,
        left_at TIMESTAMPTZ,
        duration_seconds BIGINT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        pipedrive_event_id BIGINT UNIQUE NOT NULL
      )
    `;
    console.log('✅ Created pipedrive_deal_flow_data table with correct schema');
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_pdfd_deal_id ON pipedrive_deal_flow_data(deal_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pdfd_entered_at ON pipedrive_deal_flow_data(entered_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pdfd_stage_id ON pipedrive_deal_flow_data(stage_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pdfd_created_at ON pipedrive_deal_flow_data(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pdfd_pipedrive_event_id ON pipedrive_deal_flow_data(pipedrive_event_id)`;
    console.log('📊 Created indexes');
    
    // Create trigger function
    await sql`
      CREATE OR REPLACE FUNCTION update_pipedrive_deal_flow_data_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;
    
    // Create trigger
    await sql`
      CREATE TRIGGER trigger_update_pipedrive_deal_flow_data_updated_at
        BEFORE UPDATE ON pipedrive_deal_flow_data
        FOR EACH ROW
        EXECUTE FUNCTION update_pipedrive_deal_flow_data_updated_at()
    `;
    console.log('⚡ Created trigger for updated_at');
    
    // Add comments
    await sql`COMMENT ON TABLE pipedrive_deal_flow_data IS 'Stores Pipedrive deal flow data for lead time analysis'`;
    await sql`COMMENT ON COLUMN pipedrive_deal_flow_data.pipedrive_event_id IS 'Unique Pipedrive event ID to prevent duplicates'`;
    await sql`COMMENT ON COLUMN pipedrive_deal_flow_data.deal_id IS 'Pipedrive deal ID'`;
    await sql`COMMENT ON COLUMN pipedrive_deal_flow_data.pipeline_id IS 'Pipedrive pipeline ID'`;
    await sql`COMMENT ON COLUMN pipedrive_deal_flow_data.stage_id IS 'Pipedrive stage ID'`;
    await sql`COMMENT ON COLUMN pipedrive_deal_flow_data.stage_name IS 'Human-readable stage name'`;
    await sql`COMMENT ON COLUMN pipedrive_deal_flow_data.entered_at IS 'When the deal entered this stage'`;
    await sql`COMMENT ON COLUMN pipedrive_deal_flow_data.left_at IS 'When the deal left this stage (NULL if still in stage)'`;
    await sql`COMMENT ON COLUMN pipedrive_deal_flow_data.duration_seconds IS 'Duration in seconds spent in this stage'`;
    console.log('📝 Added table comments');
    
    console.log('🎉 Successfully fixed pipedrive_deal_flow_data table!');
    
  } catch (error) {
    console.error('❌ Error fixing table:', error.message);
  }
}

fixPipedriveDealFlowData();
