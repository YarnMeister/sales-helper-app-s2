const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

async function addPipedriveEventId() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const sql = neon(connectionString);

  try {
    console.log('Adding pipedrive_event_id column...');
    
    // Check if column exists
    const columnExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pipedrive_deal_flow_data' 
        AND column_name = 'pipedrive_event_id'
      )
    `;
    
    if (columnExists[0].exists) {
      console.log('Column pipedrive_event_id already exists');
    } else {
      // Add the column
      await sql`ALTER TABLE pipedrive_deal_flow_data ADD COLUMN pipedrive_event_id BIGINT`;
      console.log('Added pipedrive_event_id column');
      
      // Create unique index
      await sql`CREATE UNIQUE INDEX idx_pdfd_pipedrive_event_id_unique ON pipedrive_deal_flow_data(pipedrive_event_id)`;
      console.log('Created unique index on pipedrive_event_id');
    }
    
    // Show table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'pipedrive_deal_flow_data' 
      ORDER BY ordinal_position
    `;
    
    console.log('\nTable structure:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

addPipedriveEventId();
