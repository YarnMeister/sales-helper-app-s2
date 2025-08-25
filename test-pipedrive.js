const { fetchDealFlow } = require('./lib/pipedrive');

async function testPipedrive() {
  try {
    console.log('Testing Pipedrive API call...');
    const flowData = await fetchDealFlow(1467);
    console.log('Flow data length:', flowData.length);
    console.log('First event:', flowData[0]);
    console.log('Event types:', [...new Set(flowData.map(e => e.object))]);
    
    const stageChanges = flowData.filter(event => event.object === 'dealChange' && event.data.field_key === 'stage_id');
    console.log('Stage changes found:', stageChanges.length);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPipedrive();
