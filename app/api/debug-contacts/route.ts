import { NextRequest } from 'next/server';
import { cache, CACHE_KEYS } from '@/lib/cache';
import { fetchContacts } from '@/lib/pipedrive';

export async function GET(request: NextRequest) {
  const debug = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    steps: [] as any[]
  };

  try {
    // Step 1: Test cache connection
    debug.steps.push({ step: 'cache_test', status: 'starting' });
    try {
      const cached = await cache.get(CACHE_KEYS.CONTACTS);
      debug.steps.push({ 
        step: 'cache_test', 
        status: 'success', 
        hasData: !!cached,
        isStale: cached?.stale || false
      });
    } catch (cacheError) {
      debug.steps.push({ 
        step: 'cache_test', 
        status: 'error', 
        error: (cacheError as Error).message 
      });
    }

    // Step 2: Test Pipedrive connection
    debug.steps.push({ step: 'pipedrive_test', status: 'starting' });
    try {
      const { persons, organizations } = await fetchContacts();
      debug.steps.push({ 
        step: 'pipedrive_test', 
        status: 'success', 
        personsCount: persons?.length || 0,
        organizationsCount: organizations?.length || 0
      });
    } catch (pipedriveError) {
      debug.steps.push({ 
        step: 'pipedrive_test', 
        status: 'error', 
        error: (pipedriveError as Error).message 
      });
    }

    // Step 3: Test environment variables
    debug.steps.push({ 
      step: 'env_check', 
      status: 'success',
      hasPipedriveToken: !!process.env.PIPEDRIVE_API_TOKEN,
      hasRedisUrl: !!process.env.REDIS_URL,
      pipedriveTokenPreview: process.env.PIPEDRIVE_API_TOKEN ? 
        `${process.env.PIPEDRIVE_API_TOKEN.substring(0, 8)}...` : 'NOT_SET'
    });

    return Response.json({ 
      ok: true, 
      debug 
    });

  } catch (e) {
    debug.steps.push({ 
      step: 'general_error', 
      status: 'error', 
      error: (e as Error).message,
      stack: (e as Error).stack
    });

    return Response.json({ 
      ok: false, 
      debug 
    });
  }
}
