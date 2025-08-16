import { NextRequest } from 'next/server';
import { cache, transformContactsHierarchy, CACHE_KEYS } from '@/lib/cache';
import { fetchContacts } from '@/lib/pipedrive';
import { errorToResponse, ExternalError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q'); // Optional text filter
    
    // Try cache first (but don't fail if cache is unavailable)
    let cached = null;
    try {
      cached = await cache.get(CACHE_KEYS.CONTACTS);
      
      if (cached && !cached.stale) {
        console.log('Serving fresh contacts from cache');
        return Response.json({ 
          ok: true, 
          data: cached.data, 
          stale: false,
          source: 'cache'
        });
      }
    } catch (cacheError) {
      console.log('Cache unavailable, proceeding to Pipedrive:', (cacheError as Error).message);
    }
    
    try {
      // TEMPORARILY DISABLED: Fetch fresh data from Pipedrive
      console.log('PIPEDRIVE API TEMPORARILY DISABLED - Testing cache only');
      throw new Error('Pipedrive API temporarily disabled for testing');
      
      // const { persons, organizations } = await fetchContacts();
      // const hierarchicalData = transformContactsHierarchy(persons, organizations);
      // await cache.set(CACHE_KEYS.CONTACTS, hierarchicalData);
      // return Response.json({ 
      //   ok: true, 
      //   data: hierarchicalData, 
      //   stale: false,
      //   source: 'pipedrive'
      // });
      
    } catch (pipedriveError) {
      console.error('Pipedrive fetch failed, checking for stale cache', { error: pipedriveError });
      
      // Fallback to stale cache if available
      if (cached) {
        console.log('Serving stale contacts from cache due to Pipedrive failure');
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
    
  } catch (e) {
    return errorToResponse(e);
  }
}
