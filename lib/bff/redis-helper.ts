import { cache, CACHE_KEYS } from '@/lib/cache';
import { CachedProductData, CachedContactData } from './types';
import { logInfo, logWarn } from '@/lib/log';

/**
 * Get cached products data from Redis
 * Returns the raw categorized product data stored in Redis
 */
export async function getCachedProducts(): Promise<CachedProductData | null> {
  try {
    const cached = await cache.get(CACHE_KEYS.PRODUCTS);
    if (cached && !cached.stale) {
      logInfo('BFF: Retrieved fresh product data from Redis cache');
      return cached.data;
    }
    
    if (cached && cached.stale) {
      logWarn('BFF: Retrieved stale product data from Redis cache');
      return cached.data;
    }
    
    logWarn('BFF: No product data found in Redis cache');
    return null;
  } catch (error) {
    logWarn('BFF: Failed to retrieve product data from Redis', { error: (error as Error).message });
    return null;
  }
}

/**
 * Get cached contacts data from Redis
 * Returns the raw hierarchical contact data stored in Redis
 */
export async function getCachedContacts(): Promise<CachedContactData | null> {
  try {
    const cached = await cache.get(CACHE_KEYS.CONTACTS);
    if (cached && !cached.stale) {
      logInfo('BFF: Retrieved fresh contact data from Redis cache');
      return cached.data;
    }
    
    if (cached && cached.stale) {
      logWarn('BFF: Retrieved stale contact data from Redis cache');
      return cached.data;
    }
    
    logWarn('BFF: No contact data found in Redis cache');
    return null;
  } catch (error) {
    logWarn('BFF: Failed to retrieve contact data from Redis', { error: (error as Error).message });
    return null;
  }
}

/**
 * Check if the cache is stale
 * Returns true if cache data exists but is stale
 */
export async function isCacheStale(): Promise<boolean> {
  try {
    const cached = await cache.get(CACHE_KEYS.PRODUCTS);
    return cached ? cached.stale : false;
  } catch (error) {
    logWarn('BFF: Failed to check cache staleness', { error: (error as Error).message });
    return false;
  }
}

/**
 * Get cache status information
 * Returns metadata about the current cache state
 */
export async function getCacheStatus() {
  try {
    const productsCached = await cache.get(CACHE_KEYS.PRODUCTS);
    const contactsCached = await cache.get(CACHE_KEYS.CONTACTS);
    
    return {
      products: {
        exists: !!productsCached,
        stale: productsCached?.stale || false,
        lastUpdated: productsCached?.timestamp || null
      },
      contacts: {
        exists: !!contactsCached,
        stale: contactsCached?.stale || false,
        lastUpdated: contactsCached?.timestamp || null
      }
    };
  } catch (error) {
    logWarn('BFF: Failed to get cache status', { error: (error as Error).message });
    return {
      products: { exists: false, stale: false, lastUpdated: null },
      contacts: { exists: false, stale: false, lastUpdated: null }
    };
  }
}
