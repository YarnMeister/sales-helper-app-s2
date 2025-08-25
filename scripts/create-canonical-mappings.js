const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function createCanonicalMappings() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const sql = neon(connectionString);

  try {
    console.log('Creating canonical stage mappings table...');
    
    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'canonical_stage_mappings'
      )
    `;
    
    if (tableExists[0].exists) {
      console.log('Table canonical_stage_mappings already exists');
    } else {
      // Create the table
      await sql`
        CREATE TABLE canonical_stage_mappings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          canonical_stage TEXT NOT NULL,
          start_stage TEXT NOT NULL,
          end_stage TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      console.log('Created canonical_stage_mappings table');
      
      // Create indexes
      await sql`CREATE INDEX idx_csm_canonical_stage ON canonical_stage_mappings(canonical_stage)`;
      await sql`CREATE INDEX idx_csm_start_stage ON canonical_stage_mappings(start_stage)`;
      await sql`CREATE INDEX idx_csm_end_stage ON canonical_stage_mappings(end_stage)`;
      console.log('Created indexes');
      
      // Create trigger
      await sql`
        CREATE OR REPLACE FUNCTION update_canonical_stage_mappings_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `;
      
      await sql`
        CREATE TRIGGER trigger_update_canonical_stage_mappings_updated_at
          BEFORE UPDATE ON canonical_stage_mappings
          FOR EACH ROW
          EXECUTE FUNCTION update_canonical_stage_mappings_updated_at()
      `;
      console.log('Created trigger');
    }
    
    // Insert default mapping
    const insertResult = await sql`
      INSERT INTO canonical_stage_mappings (canonical_stage, start_stage, end_stage)
      VALUES ('Order Conversion', 'Order Received - Johan', 'Order Inv Paid')
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    
    if (insertResult.length > 0) {
      console.log('Inserted default Order Conversion mapping');
    } else {
      console.log('Default mapping already exists');
    }
    
    // Show table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'canonical_stage_mappings' 
      ORDER BY ordinal_position
    `;
    
    console.log('\nTable structure:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Show data
    const data = await sql`SELECT * FROM canonical_stage_mappings`;
    console.log('\nTable data:');
    data.forEach(row => {
      console.log(`  ${row.canonical_stage}: ${row.start_stage} -> ${row.end_stage}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

createCanonicalMappings();
