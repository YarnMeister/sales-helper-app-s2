Create `/lib/log.ts` for structured logging 

Core Logging Infrastructure
/lib/log.ts - Central Logging Function
typescriptexport const log = (msg: string, meta?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const environment = process.env.APP_ENV || 'unknown';
  console.log(`[SH:${environment}] ${timestamp} ${msg}`, meta ?? {});
};
Format: [SH:environment] timestamp message {metadata}
Logging Categories & Usage
1. Environment & Configuration Logging
typescript// Environment validation
log(`Environment validated successfully`, { 
  environment: config.environment,
  pipedriveMode: env.PIPEDRIVE_SUBMIT_MODE 
});

log(`Environment validation failed`, { error: (error as Error).message });

// Database client creation
log(`Creating Supabase client for ${config.environment} environment`, {
  url: config.url,
  environment: config.environment
});
2. Database Operations Logging
typescript// Operation completion with timing
log(`Database operation completed: ${context}`, { 
  duration: `${duration}ms`,
  context 
});

// Database errors
log(`Database error in ${context}`, { 
  error: error instanceof Error ? error.message : String(error),
  context 
});

// Request ID generation
log(`Generated new request ID: ${newId}`);

// Health checks
log(`Database health check failed`, { 
  error: error.message,
  environment: config.environment 
});

log(`Database health check passed`, { 
  latency: `${latency}ms`,
  environment: config.environment 
});
3. Cache Operations Logging
typescript// Cache hits/misses
log(`Cache ${stale ? 'stale hit' : 'hit'}`, { 
  key, 
  age_hours: age / (1000 * 60 * 60) 
});

// Cache operations
log('Cache set', { key });
log('Cache busted', { key });
log(`KV cache updated`, { key });

// Cache errors
log('Cache get error', { key, error });
log('Cache set error', { key, error });
4. API Request & Response Logging
typescript// Request filtering and operations
log('Error fetching requests', { 
  error, 
  filters: { status, mineGroup, mineName, personId, salesperson, showAll } 
});

log('Request saved successfully', { 
  request_id: data.request_id, 
  inline_update: !!parsed.id 
});

log('Error saving request', { error, data: parsed });
log('Request deleted successfully', { id });
5. Submission & Integration Logging
typescript// Pipedrive API operations
log('Pipedrive API call failed', { endpoint, method, error });

// Submission results
log('Mock submission successful', { 
  request_id: request.request_id, 
  mock_deal_id: mockDealId 
});

log('Real submission successful', { 
  request_id: request.request_id, 
  deal_id: deal.id 
});

log('Error creating mock submission', { error: mockError });
6. Data Fetching & Transformation Logging
typescript// Cache strategies
log('Serving fresh contacts from cache');
log('Fetching fresh contacts from Pipedrive');
log('Pipedrive fetch failed, checking for stale cache', { error: pipedriveError });
log('Serving stale contacts from cache due to Pipedrive failure');

// Similar patterns for products
log('Serving fresh products from cache');
log('Fetching fresh products from Pipedrive');
7. System Operations Logging
typescript// Cache management
log('Cache keys busted', { keys });

// Validation operations  
log(`Contact JSONB validation result: ${isValid}`, { contact });
Logging Patterns & Best Practices
Structured Metadata

Always include relevant context in the meta parameter
Use consistent key naming (snake_case)
Include timing information for performance monitoring
Add environment context for multi-environment debugging

Error Context

Include operation context with errors
Preserve original error messages
Add relevant data that helps debugging

Performance Monitoring

Log operation duration for database calls
Include cache hit/miss ratios
Track API response times

Environment Awareness

Include environment in logs ([SH:test], [SH:prod])
Log environment-specific configuration
Track which database/APIs are being used

Operational Intelligence

Log business events (request created, submitted)
Track cache strategies and fallbacks
Monitor external service health

This logging strategy provides comprehensive observability across all application layers while maintaining structured, searchable log data for debugging and monitoring in production.