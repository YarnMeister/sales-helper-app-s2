#!/usr/bin/env node

/**
 * Test script to import 80 deals (2 batches of 40) for validation
 * 
 * This script tests the import process with a subset of deals to ensure
 * zero errors before proceeding with the full import of 746 deals.
 * 
 * Usage: node scripts/test-import-80-deals.js
 */

const fs = require('fs');
const path = require('path');

// Import database functions
const { insertDealFlowData, insertDealMetadata } = require('./db-helper');

// Configuration
const RATE_LIMIT_BATCH_SIZE = 40; // Pipedrive limit: 40 requests per 2 seconds
const RATE_LIMIT_DELAY_MS = 2000; // 2 seconds between batches
const TEST_DEAL_COUNT = 80; // Test with 80 deals (2 batches of 40)
const HEARTBEAT_INTERVAL = 20; // Log progress every 20 deals

// Pipedrive configuration
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_BASE_URL = process.env.PIPEDRIVE_BASE_URL || 'https://api.pipedrive.com/v1';

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL;

// Progress tracking
let totalDeals = 0;
let processedDeals = 0;
let successfulDeals = 0;
let failedDeals = [];
let startTime = null;

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
  console.log('✅ Environment variables validated');
}

/**
 * Read first 80 deal IDs from the import-id-list file
 */
function readTestDealIds() {
  const filePath = path.join(__dirname, '../specs/import-id-list');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Parse deal IDs (one per line, remove empty lines)
  const allDealIds = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !isNaN(parseInt(line)))
    .map(line => parseInt(line));
  
  // Take only the first TEST_DEAL_COUNT deals
  const testDealIds = allDealIds.slice(0, TEST_DEAL_COUNT);
  
  console.log(`📋 Loaded ${testDealIds.length} test deal IDs from ${filePath}`);
  console.log(`📊 Total deals available: ${allDealIds.length}`);
  console.log(`🧪 Test deals: ${testDealIds.slice(0, 5).join(', ')}${testDealIds.length > 5 ? '...' : ''}`);
  
  return testDealIds;
}

/**
 * Call Pipedrive API directly
 */
async function callPipedriveAPI(endpoint, method = 'GET') {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${PIPEDRIVE_BASE_URL}${endpoint}${separator}api_token=${PIPEDRIVE_API_TOKEN}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pipedrive API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to call Pipedrive API: ${error.message}`);
  }
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
    console.log(`🔄 Fetching deal flow data for deal ${dealId}...`);
    
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

    // Store flow data in database using actual database function
    console.log(`💾 Inserting ${processedFlowData.length} flow records for deal ${dealId}...`);
    const flowInsertResult = await insertDealFlowData(processedFlowData);
    console.log(`✅ Inserted ${flowInsertResult.length} flow records for deal ${dealId}`);
    
    // Store deal metadata (FIXED: use dealId parameter instead of firstEvent.deal_id)
    const firstEvent = flowData[0];
    const dealMetadata = {
      id: dealId, // FIXED: Use dealId parameter instead of firstEvent.deal_id
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
    console.log(`❌ Error processing deal ${dealId}: ${error.message}`);
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
  
  console.log(`🔄 Processing ${dealIds.length} test deals in ${batches.length} batches of ${RATE_LIMIT_BATCH_SIZE}`);
  
  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`📦 Processing test batch ${batchIndex + 1}/${batches.length} (${batch.length} deals)`);
    
    // Process all deals in the current batch concurrently
    const batchPromises = batch.map(dealId => processDeal(dealId));
    const batchResults = await Promise.all(batchPromises);
    
    // Process results
    batchResults.forEach((result, index) => {
      const dealId = batch[index];
      processedDeals++;
      
      if (result.success) {
        successfulDeals++;
        console.log(`✅ Deal ${dealId}: ${result.events} events processed`);
      } else {
        failedDeals.push({ dealId, reason: result.reason });
        console.log(`❌ Deal ${dealId}: ${result.reason}`);
      }
      
      // Heartbeat indicator
      if (processedDeals % HEARTBEAT_INTERVAL === 0) {
        const elapsed = Date.now() - startTime;
        const rate = processedDeals / (elapsed / 1000);
        console.log(`💓 Heartbeat: ${processedDeals}/${totalDeals} test deals processed (${rate.toFixed(1)} deals/sec)`);
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
 * Main execution function
 */
async function main() {
  try {
    console.log('🧪 Starting 80-deal test import...');
    console.log('📋 This test will validate the import process before running the full import');
    startTime = Date.now();
    
    // Validate environment
    validateEnvironment();
    
    // Read test deal IDs
    const dealIds = readTestDealIds();
    totalDeals = dealIds.length;
    
    if (totalDeals === 0) {
      console.log('❌ No test deal IDs found in file');
      process.exit(1);
    }
    
    // Process test deals
    await processDealsInBatches(dealIds);
    
    // Final summary
    const elapsed = Date.now() - startTime;
    const totalFailed = failedDeals.length;
    const successRate = ((successfulDeals / totalDeals) * 100).toFixed(1);
    
    console.log('\n📊 TEST IMPORT SUMMARY');
    console.log('======================');
    console.log(`Test deals: ${totalDeals}`);
    console.log(`Successful: ${successfulDeals}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success rate: ${successRate}%`);
    console.log(`Test time: ${(elapsed / 1000).toFixed(1)} seconds`);
    console.log(`Average rate: ${(totalDeals / (elapsed / 1000)).toFixed(1)} deals/second`);
    
    if (totalFailed > 0) {
      console.log('\n❌ Failed test deals:');
      failedDeals.forEach(f => {
        console.log(`  Deal ${f.dealId}: ${f.reason}`);
      });
      console.log('\n⚠️  TEST FAILED: Some deals failed to import');
      console.log('   Please investigate the issues before proceeding with full import');
      process.exit(1);
    }
    
    console.log('\n✅ TEST PASSED: All 80 deals imported successfully!');
    console.log('\n📊 Test data has been successfully imported into the database.');
    console.log('   Flow data: pipedrive_deal_flow_data table');
    console.log('   Metadata: pipedrive_metric_data table');
    console.log('\n🚀 Ready to proceed with full import of remaining deals');
    console.log('   Run: node scripts/import-deal-flow-data.js');
    
  } catch (error) {
    console.error('💥 Fatal error during test import:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, processDeal, readTestDealIds };
