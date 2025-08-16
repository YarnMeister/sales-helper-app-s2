import { NextRequest } from 'next/server';
import { cache, transformContactsHierarchy, CACHE_KEYS } from '@/lib/cache';
import { fetchContacts } from '@/lib/pipedrive';
import { errorToResponse, ExternalError } from '@/lib/errors';
import { logInfo, logWarn, logError, withPerformanceLogging, generateCorrelationId } from '@/lib/log';

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  
  return withPerformanceLogging('GET /api/contacts', 'api', async () => {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q'); // Optional text filter
    const forceRefresh = searchParams.get('refresh') === 'true'; // Force refresh parameter
    
    logInfo('Contacts API request started', { 
      correlationId, 
      query: q,
      forceRefresh,
      userAgent: request.headers.get('user-agent')
    });
    
    // Try cache first (but don't fail if cache is unavailable)
    let cached = null;
    if (!forceRefresh) {
      try {
        cached = await cache.get(CACHE_KEYS.CONTACTS);
        
        if (cached && !cached.stale) {
          logInfo('Serving fresh contacts from cache', { correlationId });
          return Response.json({ 
            ok: true, 
            data: cached.data, 
            stale: false,
            source: 'cache'
          });
        }
      } catch (cacheError) {
        logWarn('Cache unavailable, proceeding to Pipedrive', { 
          correlationId, 
          error: (cacheError as Error).message 
        });
      }
    }
    
    try {
      // Fetch fresh data from Pipedrive
      logInfo('Fetching fresh contacts from Pipedrive', { correlationId });
      const { persons, organizations } = await fetchContacts();
      
      // PRD requirement: Transform to hierarchical Mine Group > Mine Name structure
      const hierarchicalData = transformContactsHierarchy(persons, organizations);
      
      // Try to update cache (but don't fail if cache is unavailable)
      try {
        await cache.set(CACHE_KEYS.CONTACTS, hierarchicalData);
      } catch (cacheError) {
        logWarn('Failed to update cache', { 
          correlationId, 
          error: (cacheError as Error).message 
        });
      }
      
      logInfo('Contacts API request completed successfully', { 
        correlationId, 
        source: 'pipedrive',
        personsCount: persons.length,
        organizationsCount: organizations.length
      });
      
      return Response.json({ 
        ok: true, 
        data: hierarchicalData, 
        stale: false,
        source: 'pipedrive'
      });
      
    } catch (pipedriveError) {
      logError('Pipedrive fetch failed, checking for stale cache', { 
        correlationId, 
        error: pipedriveError 
      });
      
      // Fallback to stale cache if available
      if (cached) {
        logWarn('Serving stale contacts from cache due to Pipedrive failure', { correlationId });
        return Response.json({ 
          ok: true, 
          data: cached.data, 
          stale: true,
          source: 'cache_fallback',
          error: 'Pipedrive temporarily unavailable'
        });
      }
      
      // No cache available, return error
      throw new ExternalError('Unable to fetch contacts and no cached data available');
    }
  }, { correlationId });
}
