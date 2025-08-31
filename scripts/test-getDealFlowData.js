require('dotenv').config({ path: '.env.local' });
const { getDealFlowData } = require('../lib/db');

async function testGetDealFlowData() {
  try {
    console.log('🔍 Testing getDealFlowData function...');
    
    // Test 1: Without deal ID
    console.log('\n📊 Test 1: getDealFlowData() without deal ID');
    const result1 = await getDealFlowData();
    console.log(`Result: ${result1.length} rows`);
    
    if (result1.length > 0) {
      console.log('Sample row:', result1[0]);
    }
    
    // Test 2: With deal ID
    console.log('\n📊 Test 2: getDealFlowData(1205) with deal ID');
    const result2 = await getDealFlowData(1205);
    console.log(`Result: ${result2.length} rows`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGetDealFlowData();
