#!/usr/bin/env node

/**
 * Retry script for failed deal imports
 * 
 * This script retries importing deals that failed during the main import process.
 * It reads deal IDs from a file and attempts to import them again.
 * 
 * Usage: node scripts/retry-failed-deals.js failed-deals-import.txt
 */

const fs = require('fs');
const path = require('path');

// Import database functions
const { insertDealFlowData, insertDealMetadata } = require('./db-helper');

// Configuration
const RATE_LIMIT_BATCH_SIZE = 40; // Pipedrive limit: 40 requests per 2 seconds
const RATE_LIMIT_DELAY_MS = 2000; // 2 seconds between batches
const MAX_RETRIES = 1; // Retry failed deals once
const HEARTBEAT_INTERVAL = 20; // Log progress every 20 deals

// Pipedrive API configuration
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL;

// Global variables
let startTime;
let totalDeals = 0;
let successfulDeals = 0;
let failedDeals = [];

/**
 * Validate environment variables
 */
function validateEnvironment() {
  if (!PIPEDRIVE_API_TOKEN) {
    throw new Error('PIPEDRIVE_API_TOKEN environment variable is required');
  }
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
}

/**
 * Read failed deal IDs from file
 */
function readFailedDealIds(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Failed deals file not found: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const dealIds = content.trim().split('\n').filter(line => line.trim());
  
  console.log(`📄 Reading ${dealIds.length} failed deal IDs from: ${filePath}`);
  return dealIds;
}

/**
 * Call Pipedrive API with error handling
 */
async function callPipedriveAPI(endpoint) {
  const url = `${PIPEDRIVE_BASE_URL}${endpoint}?api_token=${PIPEDRIVE_API_TOKEN}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Pipedrive API authentication failed. Check your API token.');
    } else if (response.status === 404) {
      throw new Error('Deal not found in Pipedrive');
    } else if (response.status === 429) {
      throw new Error('Pipedrive API rate limit exceeded');
    } else {
      throw new Error(`Pipedrive API error: ${response.status} ${response.statusText}`);
    }
  }
  
  return await response.json();
}

/**
 * Fetch deal flow data from Pipedrive
 */
async function fetchDealFlow(dealId) {
  const response = await callPipedriveAPI(`/deals/${dealId}/flow`);
  return response.data || [];
}

/**
 * Process a single deal
 */
async function processDeal(dealId) {
  try {
    console.log(`🔄 Retrying deal ${dealId}...`);
    
    // Fetch flow data from Pipedrive
    const flowData = await fetchDealFlow(dealId);
    
    if (!flowData || flowData.length === 0) {
      console.log(`❌ No flow data found for deal ${dealId}`);
      return { success: false, reason: 'No flow data found' };
    }
    
    // Process flow data to calculate durations and left_at times
    const stageChanges = flowData
      .filter((event) => event.object === 'dealChange' && event.data.field_key === 'stage_id')
      .map((event) => ({
        pipedrive_event_id: event.data.id,
        deal_id: event.data.item_id,
        stage_id: parseInt(event.data.new_value),
        stage_name: event.data.additional_data?.new_value_formatted || `Stage ${event.data.new_value}`,
        entered_at: event.timestamp,
        old_stage_id: parseInt(event.data.old_value),
        old_stage_name: event.data.additional_data?.old_value_formatted || `Stage ${event.data.old_value}`,
        user_id: event.data.user_id,
        log_time: event.data.log_time
      }))
      .sort((a, b) => new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime());
    
    // Calculate durations and left_at times
    const processedFlowData = stageChanges.map((event, index) => {
      const nextEvent = stageChanges[index + 1];
      const left_at = nextEvent ? nextEvent.entered_at : null;
      const duration_seconds = left_at 
        ? Math.floor((new Date(left_at).getTime() - new Date(event.entered_at).getTime()) / 1000)
        : null;

      return {
        pipedrive_event_id: event.pipedrive_event_id,
        deal_id: event.deal_id,
        pipeline_id: 1, // Default pipeline ID
        stage_id: event.stage_id,
        stage_name: event.stage_name,
        entered_at: event.entered_at,
        left_at,
        duration_seconds
      };
    });

    // Store flow data in database
    console.log(`💾 Inserting ${processedFlowData.length} flow records for deal ${dealId}...`);
    const flowInsertResult = await insertDealFlowData(processedFlowData);
    console.log(`✅ Inserted ${flowInsertResult.length} flow records for deal ${dealId}`);
    
    // Store deal metadata
    const firstEvent = flowData[0];
    const dealMetadata = {
      id: dealId,
      title: `Deal ${dealId}`,
      pipeline_id: 1,
      stage_id: 1,
      status: 'active'
    };
    
    console.log(`💾 Inserting metadata for deal ${dealId}...`);
    const metadataInsertResult = await insertDealMetadata(dealMetadata);
    console.log(`✅ Inserted metadata for deal ${dealId}`);
    
    return { success: true, events: processedFlowData.length };
    
  } catch (error) {
    console.log(`❌ Error retrying deal ${dealId}: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

/**
 * Process deals in batches with rate limiting
 */
async function processDealsInBatches(dealIds) {
  const batches = [];
  
  // Split deals into batches of RATE_LIMIT_BATCH_SIZE
  for (let i = 0; i < dealIds.length; i += RATE_LIMIT_BATCH_SIZE) {
    batches.push(dealIds.slice(i, i + RATE_LIMIT_BATCH_SIZE));
  }
  
  console.log(`🔄 Processing ${dealIds.length} failed deals in ${batches.length} batches of ${RATE_LIMIT_BATCH_SIZE}`);
  
  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`📦 Processing retry batch ${batchIndex + 1}/${batches.length} (${batch.length} deals)`);
    
    // Process all deals in the current batch concurrently
    const batchPromises = batch.map(dealId => processDeal(dealId));
    const batchResults = await Promise.all(batchPromises);
    
    // Process results
    batchResults.forEach((result, index) => {
      const dealId = batch[index];
      
      if (result.success) {
        successfulDeals++;
        console.log(`✅ Retry successful for deal ${dealId}: ${result.events} events processed`);
      } else {
        failedDeals.push({ dealId, reason: result.reason });
        console.log(`❌ Retry failed for deal ${dealId}: ${result.reason}`);
      }
    });
    
    // Rate limiting: wait between batches (except for the last batch)
    if (batchIndex < batches.length - 1) {
      console.log(`⏳ Rate limiting: waiting ${RATE_LIMIT_DELAY_MS}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }
  }
}

/**
 * Export still-failed deals to a new file
 */
function exportStillFailedDeals() {
  if (failedDeals.length === 0) return;
  
  const stillFailedFile = 'still-failed-deals.txt';
  const stillFailedContent = failedDeals.map(f => f.dealId).join('\n');
  
  fs.writeFileSync(stillFailedFile, stillFailedContent);
  console.log(`📄 Still-failed deals exported to: ${stillFailedFile}`);
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Check command line arguments
    const failedDealsFile = process.argv[2];
    if (!failedDealsFile) {
      console.log('❌ Usage: node scripts/retry-failed-deals.js <failed-deals-file>');
      console.log('   Example: node scripts/retry-failed-deals.js failed-deals-import.txt');
      process.exit(1);
    }
    
    console.log('🔄 Starting retry of failed deals...');
    startTime = Date.now();
    
    // Validate environment
    validateEnvironment();
    
    // Read failed deal IDs
    const dealIds = readFailedDealIds(failedDealsFile);
    totalDeals = dealIds.length;
    
    if (totalDeals === 0) {
      console.log('❌ No failed deal IDs found in file');
      process.exit(1);
    }
    
    // Process failed deals
    await processDealsInBatches(dealIds);
    
    // Export still-failed deals
    exportStillFailedDeals();
    
    // Final summary
    const elapsed = Date.now() - startTime;
    const totalFailed = failedDeals.length;
    const successRate = ((successfulDeals / totalDeals) * 100).toFixed(1);
    
    console.log('\n📊 RETRY SUMMARY');
    console.log('================');
    console.log(`Failed deals retried: ${totalDeals}`);
    console.log(`Retry successful: ${successfulDeals}`);
    console.log(`Still failed: ${totalFailed}`);
    console.log(`Retry success rate: ${successRate}%`);
    console.log(`Retry time: ${(elapsed / 1000).toFixed(1)} seconds`);
    
    if (totalFailed > 0) {
      console.log('\n❌ Still failed deals:');
      failedDeals.forEach(f => {
        console.log(`  Deal ${f.dealId}: ${f.reason}`);
      });
      console.log(`\n📄 Still-failed deals exported to: still-failed-deals.txt`);
    }
    
    console.log('\n✅ Retry process completed!');
    
  } catch (error) {
    console.error('💥 Fatal error during retry:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, processDeal, readFailedDealIds };
