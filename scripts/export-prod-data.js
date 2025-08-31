#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

// You'll need to update this with the correct production database URL
const PROD_DB_URL = 'YOUR_PRODUCTION_DATABASE_URL_HERE';

if (PROD_DB_URL === 'YOUR_PRODUCTION_DATABASE_URL_HERE') {
  console.log('❌ Please update the PROD_DB_URL in this script with your production database URL');
  console.log('   You can find this in the Neon console under your main branch');
  process.exit(1);
}

const { neon } = require('@neondatabase/serverless');
const prodSql = neon(PROD_DB_URL);

const TABLES_TO_EXPORT = [
  'canonical_stage_mappings',
  'flow_metrics_config', 
  'pipedrive_deal_flow_data'
];

async function exportTableData(tableName) {
  try {
    console.log(`📋 Exporting data from ${tableName}...`);
    
    const data = await prodSql`SELECT * FROM ${prodSql(tableName)}`;
    
    if (data.length === 0) {
      console.log(`⚠️  No data found in ${tableName}`);
      return;
    }
    
    // Convert to CSV
    const columns = Object.keys(data[0]);
    const csvHeader = columns.join(',');
    const csvRows = data.map(row => 
      columns.map(col => {
        const value = row[col];
        // Escape quotes and wrap in quotes if needed
        if (value === null) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Save to file
    const filename = `export_${tableName}_${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(filename, csvContent);
    
    console.log(`✅ Exported ${data.length} rows to ${filename}`);
    
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error.message);
  }
}

async function main() {
  console.log('🔄 Exporting data from production database...\n');
  
  for (const tableName of TABLES_TO_EXPORT) {
    await exportTableData(tableName);
    console.log('');
  }
  
  console.log('🎉 Export completed!');
  console.log('📁 Check the generated CSV files in the current directory');
}

main();
