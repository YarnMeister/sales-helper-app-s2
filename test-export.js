// Test file to check exports
import('./lib/database/index.ts')
  .then(module => {
    console.log('Available exports:', Object.keys(module));
    console.log('FlowMetricsRepository:', typeof module.FlowMetricsRepository);
    console.log('CanonicalStageMappingsRepository:', typeof module.CanonicalStageMappingsRepository);
  })
  .catch(error => {
    console.error('Import error:', error.message);
  });
