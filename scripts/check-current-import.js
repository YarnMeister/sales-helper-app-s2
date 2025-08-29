#!/usr/bin/env node

/**
 * Check current state of imported deal flow data
 */

require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function checkCurrentImport() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const sql = neon(connectionString);
  
  try {
    console.log('🔍 Checking current import state...\n');
    
    // Check total records
    const totalRecords = await sql`SELECT COUNT(*) as count FROM pipedrive_deal_flow_data`;
    console.log(`📊 Total flow data records: ${totalRecords[0].count}`);
    
    // Check unique deals
    const uniqueDeals = await sql`SELECT COUNT(DISTINCT deal_id) as count FROM pipedrive_deal_flow_data`;
    console.log(`📊 Unique deals imported: ${uniqueDeals[0].count}`);
    
    // Check metadata records
    const metadataRecords = await sql`SELECT COUNT(*) as count FROM pipedrive_metric_data`;
    console.log(`📊 Metadata records: ${metadataRecords[0].count}`);
    
    // Get sample of deal IDs
    const sampleDeals = await sql`SELECT DISTINCT deal_id FROM pipedrive_deal_flow_data ORDER BY deal_id LIMIT 10`;
    console.log(`📊 Sample deal IDs: ${sampleDeals.map(d => d.deal_id).join(', ')}`);
    
    // Check for any records without pipedrive_event_id
    const nullEventIds = await sql`SELECT COUNT(*) as count FROM pipedrive_deal_flow_data WHERE pipedrive_event_id IS NULL`;
    console.log(`⚠️  Records without pipedrive_event_id: ${nullEventIds[0].count}`);
    
    console.log('\n✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    process.exit(0);
  }
}

checkCurrentImport();
