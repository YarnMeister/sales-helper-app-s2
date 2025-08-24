import { NextRequest } from 'next/server';
import { cache, CACHE_KEYS } from '@/lib/cache';
import { logInfo, logError, withPerformanceLogging, generateCorrelationId } from '@/lib/log';

export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  
  return withPerformanceLogging('POST /api/cache/refresh', 'api', async () => {
    try {
      logInfo('Cache refresh request started', { 
        correlationId,
        userAgent: request.headers.get('user-agent')
      });
      
      // Bust both contacts and products cache
      await Promise.all([
        cache.bust(CACHE_KEYS.CONTACTS),
        cache.bust(CACHE_KEYS.PRODUCTS)
      ]);
      
      logInfo('Cache refresh completed successfully', { 
        correlationId,
        bustedKeys: [CACHE_KEYS.CONTACTS, CACHE_KEYS.PRODUCTS]
      });
      
      return Response.json({ 
        ok: true, 
        message: 'Cache refreshed successfully',
        bustedKeys: [CACHE_KEYS.CONTACTS, CACHE_KEYS.PRODUCTS]
      });
      
    } catch (error) {
      logError('Cache refresh failed', { 
        correlationId, 
        error: (error as Error).message 
      });
      
      return Response.json({ 
        ok: false, 
        error: 'Failed to refresh cache'
      }, { status: 500 });
    }
  }, { correlationId });
}
