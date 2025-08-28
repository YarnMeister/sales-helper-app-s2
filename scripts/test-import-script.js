#!/usr/bin/env node

/**
 * Test version of the import script - validates deal ID reading and basic structure
 */

const fs = require('fs');
const path = require('path');

// Configuration
const RATE_LIMIT_BATCH_SIZE = 40;
const RATE_LIMIT_DELAY_MS = 2000;
const HEARTBEAT_INTERVAL = 100;

// Progress tracking
let totalDeals = 0;
let processedDeals = 0;
let startTime = null;

/**
 * Read deal IDs from the file
 */
function readDealIds() {
  const filePath = path.join(__dirname, '../specs/deal-id.md');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Parse deal IDs (one per line, remove empty lines)
  const dealIds = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !isNaN(parseInt(line)))
    .map(line => parseInt(line));
  
  console.log(`📋 Loaded ${dealIds.length} deal IDs from ${filePath}`);
  return dealIds;
}

/**
 * Simulate processing a single deal (no actual API call)
 */
async function processDeal(dealId) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  
  // Simulate success/failure (90% success rate for testing)
  const success = Math.random() > 0.1;
  const events = Math.floor(Math.random() * 10) + 1;
  
  if (success) {
    console.log(`✅ Deal ${dealId}: ${events} events processed (simulated)`);
    return { success: true, events };
  } else {
    console.log(`❌ Deal ${dealId}: Simulated failure`);
    return { success: false, reason: 'Simulated failure for testing' };
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
  
  console.log(`🔄 Processing ${dealIds.length} deals in ${batches.length} batches of ${RATE_LIMIT_BATCH_SIZE}`);
  
  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} deals)`);
    
    // Process all deals in the current batch concurrently
    const batchPromises = batch.map(dealId => processDeal(dealId));
    const batchResults = await Promise.all(batchPromises);
    
    // Process results
    batchResults.forEach((result, index) => {
      const dealId = batch[index];
      processedDeals++;
      
      // Heartbeat indicator
      if (processedDeals % HEARTBEAT_INTERVAL === 0) {
        const elapsed = Date.now() - startTime;
        const rate = processedDeals / (elapsed / 1000);
        console.log(`💓 Heartbeat: ${processedDeals}/${totalDeals} deals processed (${rate.toFixed(1)} deals/sec)`);
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
    console.log('🚀 Starting deal flow data import test...');
    startTime = Date.now();
    
    // Read deal IDs
    const dealIds = readDealIds();
    totalDeals = dealIds.length;
    
    if (totalDeals === 0) {
      console.log('❌ No deal IDs found in file');
      process.exit(1);
    }
    
    // Process first 10 deals as a test
    const testDeals = dealIds.slice(0, 10);
    console.log(`🧪 Testing with first ${testDeals.length} deals...`);
    
    await processDealsInBatches(testDeals);
    
    // Final summary
    const elapsed = Date.now() - startTime;
    
    console.log('\n📊 TEST SUMMARY');
    console.log('==================');
    console.log(`Total deals in file: ${totalDeals}`);
    console.log(`Test deals processed: ${testDeals.length}`);
    console.log(`Test time: ${(elapsed / 1000).toFixed(1)} seconds`);
    console.log(`Test rate: ${(testDeals.length / (elapsed / 1000)).toFixed(1)} deals/second`);
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 To run the actual import:');
    console.log('   1. Set PIPEDRIVE_API_TOKEN and DATABASE_URL environment variables');
    console.log('   2. Run: node scripts/import-deal-flow-data.js');
    console.log('   3. Expected time for full import: ~30-45 minutes (578 deals)');
    
  } catch (error) {
    console.error('💥 Fatal error during test:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, processDeal, readDealIds };
