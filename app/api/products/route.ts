import { NextRequest } from 'next/server';
import { cache, transformProductsHierarchy, CACHE_KEYS } from '@/lib/cache';
import { fetchProducts } from '@/lib/pipedrive';
import { errorToResponse, ExternalError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Try cache first
    const cached = await cache.get(CACHE_KEYS.PRODUCTS);
    
    if (cached && !cached.stale) {
      console.log('Serving fresh products from cache');
      return Response.json({ 
        ok: true, 
        data: cached.data, 
        stale: false,
        source: 'cache'
      });
    }
    
    try {
      // Fetch fresh data from Pipedrive
      console.log('Fetching fresh products from Pipedrive');
      const products = await fetchProducts();
      
      // PRD requirement: Transform to categorized structure
      const categorizedData = transformProductsHierarchy(products);
      
      // Update cache
      await cache.set(CACHE_KEYS.PRODUCTS, categorizedData);
      
      return Response.json({ 
        ok: true, 
        data: categorizedData, 
        stale: false,
        source: 'pipedrive'
      });
      
    } catch (pipedriveError) {
      console.error('Pipedrive fetch failed, checking for stale cache', { error: pipedriveError });
      
      // Fallback to stale cache if available
      if (cached) {
        console.log('Serving stale products from cache due to Pipedrive failure');
        return Response.json({ 
          ok: true, 
          data: cached.data, 
          stale: true,
          source: 'cache_fallback',
          error: 'Pipedrive temporarily unavailable'
        });
      }
      
      // No cache available, return error
      throw new ExternalError('Unable to fetch products and no cached data available');
    }
    
  } catch (e) {
    return errorToResponse(e);
  }
}
