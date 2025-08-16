import { NextRequest } from 'next/server';
import { cache, transformProductsHierarchy, CACHE_KEYS } from '@/lib/cache';
import { fetchProducts } from '@/lib/pipedrive';
import { errorToResponse, ExternalError } from '@/lib/errors';
import { logInfo, logWarn, logError, withPerformanceLogging, generateCorrelationId } from '@/lib/log';

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('forceRefresh') === 'true';
  
  return withPerformanceLogging('GET /api/products', 'api', async () => {
    logInfo('Products API request started', { 
      correlationId,
      userAgent: request.headers.get('user-agent'),
      forceRefresh
    });
    
    // Try cache first (but don't fail if cache is unavailable)
    let cached = null;
    try {
      cached = await cache.get(CACHE_KEYS.PRODUCTS);
      
      if (cached && !cached.stale && !forceRefresh) {
        logInfo('Serving fresh products from cache', { correlationId });
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
    
    try {
      // Fetch fresh data from Pipedrive
      logInfo('Fetching fresh products from Pipedrive', { correlationId });
      const products = await fetchProducts();
      
      // PRD requirement: Transform to categorized structure
      const categorizedData = transformProductsHierarchy(products);
      
      // Try to update cache (but don't fail if cache is unavailable)
      try {
        await cache.set(CACHE_KEYS.PRODUCTS, categorizedData);
      } catch (cacheError) {
        logWarn('Failed to update cache', { 
          correlationId, 
          error: (cacheError as Error).message 
        });
      }
      
      logInfo('Products API request completed successfully', { 
        correlationId, 
        source: 'pipedrive',
        productsCount: products.length
      });
      
      return Response.json({ 
        ok: true, 
        data: categorizedData, 
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
        logWarn('Serving stale products from cache due to Pipedrive failure', { correlationId });
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
  }, { correlationId });
}
