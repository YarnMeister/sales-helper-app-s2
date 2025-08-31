require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function fixCanonicalStageMappings() {
  try {
    console.log('🔧 Fixing canonical_stage_mappings table schema...');
    
    // Drop the existing table
    await sql`DROP TABLE IF EXISTS canonical_stage_mappings CASCADE`;
    console.log('🗑️  Dropped existing canonical_stage_mappings table');
    
    // Create the table with the correct schema
    await sql`
      CREATE TABLE canonical_stage_mappings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        canonical_stage TEXT NOT NULL,
        start_stage TEXT,
        end_stage TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        metric_config_id UUID,
        start_stage_id BIGINT,
        end_stage_id BIGINT,
        avg_min_days INTEGER,
        avg_max_days INTEGER,
        metric_comment TEXT
      )
    `;
    console.log('✅ Created canonical_stage_mappings table with correct schema');
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_csm_canonical_stage ON canonical_stage_mappings(canonical_stage)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_csm_start_stage ON canonical_stage_mappings(start_stage)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_csm_end_stage ON canonical_stage_mappings(end_stage)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_csm_start_stage_id ON canonical_stage_mappings(start_stage_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_csm_end_stage_id ON canonical_stage_mappings(end_stage_id)`;
    console.log('📊 Created indexes');
    
    // Create trigger function
    await sql`
      CREATE OR REPLACE FUNCTION update_canonical_stage_mappings_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;
    
    // Create trigger
    await sql`
      CREATE TRIGGER trigger_update_canonical_stage_mappings_updated_at
        BEFORE UPDATE ON canonical_stage_mappings
        FOR EACH ROW
        EXECUTE FUNCTION update_canonical_stage_mappings_updated_at()
    `;
    console.log('⚡ Created trigger for updated_at');
    
    // Add comments
    await sql`COMMENT ON TABLE canonical_stage_mappings IS 'Maps canonical stages to Pipedrive stage names for lead time analysis. Stage IDs are preferred over stage names for accuracy.'`;
    await sql`COMMENT ON COLUMN canonical_stage_mappings.canonical_stage IS 'The canonical stage name (e.g., Order Conversion)'`;
    await sql`COMMENT ON COLUMN canonical_stage_mappings.start_stage IS 'The Pipedrive stage name that marks the start of this canonical stage'`;
    await sql`COMMENT ON COLUMN canonical_stage_mappings.end_stage IS 'The Pipedrive stage name that marks the end of this canonical stage'`;
    await sql`COMMENT ON COLUMN canonical_stage_mappings.start_stage_id IS 'Pipedrive stage ID for the start stage (preferred over start_stage)'`;
    await sql`COMMENT ON COLUMN canonical_stage_mappings.end_stage_id IS 'Pipedrive stage ID for the end stage (preferred over end_stage)'`;
    await sql`COMMENT ON COLUMN canonical_stage_mappings.avg_min_days IS 'Minimum threshold in days for green color coding (excellent performance)'`;
    await sql`COMMENT ON COLUMN canonical_stage_mappings.avg_max_days IS 'Maximum threshold in days for red color coding (needs attention)'`;
    await sql`COMMENT ON COLUMN canonical_stage_mappings.metric_comment IS 'Narrative or interpretation about the current metric performance'`;
    console.log('📝 Added table comments');
    
    console.log('🎉 Successfully fixed canonical_stage_mappings table!');
    
  } catch (error) {
    console.error('❌ Error fixing table:', error.message);
  }
}

fixCanonicalStageMappings();
