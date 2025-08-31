#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const sql = neon(process.env.DATABASE_URL);

async function importCSV(tableName, csvFilePath) {
  try {
    console.log(`📋 Importing CSV to ${tableName}...`);
    
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      console.error(`❌ CSV file not found: ${csvFilePath}`);
      return;
    }
    
    // Read CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    console.log(`📥 Read CSV file: ${csvFilePath}`);
    
    // Clear existing data
    if (tableName === 'canonical_stage_mappings') {
      await sql`DELETE FROM canonical_stage_mappings`;
    } else if (tableName === 'flow_metrics_config') {
      await sql`DELETE FROM flow_metrics_config`;
    } else if (tableName === 'pipedrive_deal_flow_data') {
      await sql`DELETE FROM pipedrive_deal_flow_data`;
    }
    console.log(`🗑️  Cleared existing data from ${tableName}`);
    
    // Split CSV into lines
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      console.error('❌ CSV file must have at least a header and one data row');
      return;
    }
    
    const header = lines[0];
    const dataRows = lines.slice(1);
    
    console.log(`📊 Found ${dataRows.length} data rows`);
    
    // Parse header to get column names
    const columns = header.split(',').map(col => col.trim().replace(/"/g, ''));
    console.log(`📋 Columns: ${columns.join(', ')}`);
    
    // Insert each row using a simpler approach
    let insertedCount = 0;
    for (const row of dataRows) {
      if (row.trim()) {
        const values = row.split(',').map(val => {
          const trimmed = val.trim().replace(/"/g, '');
          return trimmed === '' ? null : trimmed;
        });
        
        // Create an object with column names as keys
        const rowData = {};
        columns.forEach((col, index) => {
          rowData[col] = values[index];
        });
        
        // Use a simple INSERT with the first few columns we know exist
        if (tableName === 'canonical_stage_mappings') {
          await sql`
            INSERT INTO canonical_stage_mappings (id, canonical_stage, start_stage, end_stage, created_at, updated_at, metric_config_id, start_stage_id, end_stage_id, avg_min_days, avg_max_days, metric_comment)
            VALUES (${rowData.id}, ${rowData.canonical_stage}, ${rowData.start_stage}, ${rowData.end_stage}, ${rowData.created_at}, ${rowData.updated_at}, ${rowData.metric_config_id}, ${rowData.start_stage_id}, ${rowData.end_stage_id}, ${rowData.avg_min_days}, ${rowData.avg_max_days}, ${rowData.metric_comment})
          `;
        } else if (tableName === 'flow_metrics_config') {
          await sql`
            INSERT INTO flow_metrics_config (metric_key, display_title, canonical_stage, sort_order, is_active, created_at, updated_at)
            VALUES (${rowData.metric_key}, ${rowData.display_title}, ${rowData.canonical_stage}, ${rowData.sort_order}, ${rowData.is_active}, ${rowData.created_at}, ${rowData.updated_at})
          `;
        } else if (tableName === 'pipedrive_deal_flow_data') {
          await sql`
            INSERT INTO pipedrive_deal_flow_data (id, deal_id, pipeline_id, stage_id, stage_name, entered_at, left_at, duration_seconds, created_at, updated_at, pipedrive_event_id)
            VALUES (${rowData.id}, ${rowData.deal_id}, ${rowData.pipeline_id}, ${rowData.stage_id}, ${rowData.stage_name}, ${rowData.entered_at}, ${rowData.left_at}, ${rowData.duration_seconds}, ${rowData.created_at}, ${rowData.updated_at}, ${rowData.pipedrive_event_id})
          `;
        }
        
        insertedCount++;
      }
    }
    
    console.log(`✅ Successfully imported ${insertedCount} rows to ${tableName}`);
    
  } catch (error) {
    console.error(`❌ Error importing to ${tableName}:`, error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log('Usage: node scripts/import-csv.js <table_name> <csv_file_path>');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/import-csv.js canonical_stage_mappings ./export_canonical_stage_mappings_2024-12-30.csv');
    console.log('  node scripts/import-csv.js flow_metrics_config ./export_flow_metrics_config_2024-12-30.csv');
    console.log('  node scripts/import-csv.js pipedrive_deal_flow_data ./export_pipedrive_deal_flow_data_2024-12-30.csv');
    process.exit(1);
  }
  
  const [tableName, csvFilePath] = args;
  
  console.log('🔄 Starting CSV import...\n');
  
  // Validate table exists
  const tables = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = ${tableName}
  `;
  
  if (tables.length === 0) {
    console.error(`❌ Table '${tableName}' does not exist in the database`);
    console.log('Available tables:');
    const allTables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    allTables.forEach(row => console.log(`  - ${row.table_name}`));
    process.exit(1);
  }
  
  await importCSV(tableName, csvFilePath);
  
  console.log('\n🎉 CSV import completed!');
}

main();
