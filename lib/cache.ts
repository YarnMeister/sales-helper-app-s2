import { Redis } from '@upstash/redis';
import { getCacheConfig } from './env';
import { logInfo, logWarn, logError, withPerformanceLogging } from './log';

// Create Redis client
let redis: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redis) {
    const config = getCacheConfig();
    
    redis = new Redis({
      url: config.url,
      token: config.token,
    });
    
    logInfo(`Redis client created for ${config.environment} environment`, {
      environment: config.environment
    });
  }
  
  return redis;
};

// Cache configuration - Optimized for better performance
const CACHE_MAX_AGE_SECONDS = 2 * 60 * 60; // 2 hours (reduced from 24 hours)
const STALE_WHILE_REVALIDATE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  stale: boolean;
  source: 'redis' | 'fresh';
}

export class KVCache {
  private redis = getRedisClient();
  
  async get<T = any>(key: string): Promise<CacheEntry<T> | null> {
    return withPerformanceLogging('cache.get', 'cache', async () => {
      // Get data and TTL in a pipeline for efficiency
      const pipeline = this.redis.pipeline();
      pipeline.get(key);
      pipeline.ttl(key);
      
      const [data, ttl] = await pipeline.exec() as [T | null, number];
      
      if (data === null) {
        logInfo(`Cache miss`, { key });
        return null;
      }
      
      const now = Date.now();
      const timestamp = (data as any)?.timestamp || now;
      const age = now - timestamp;
      const isStale = ttl < 0 || age > CACHE_MAX_AGE_SECONDS * 1000;
      
      logInfo(`Cache ${isStale ? 'stale hit' : 'hit'}`, { 
        key, 
        age_hours: age / (1000 * 60 * 60),
        ttl_seconds: ttl,
        stale: isStale
      });
      
      return {
        data: (data as any)?.data || data,
        timestamp,
        ttl,
        stale: isStale,
        source: 'redis'
      };
    }, { key });
  }
  
  async set<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    return withPerformanceLogging('cache.set', 'cache', async () => {
      const cacheValue = {
        data: value,
        timestamp: Date.now()
      };
      
      const ttl = ttlSeconds || CACHE_MAX_AGE_SECONDS;
      
      await this.redis.setex(key, ttl, cacheValue);
      
      logInfo('Cache set', { 
        key, 
        ttl_seconds: ttl,
        size_estimate: JSON.stringify(cacheValue).length 
      });
    }, { key, ttl_seconds: ttlSeconds || CACHE_MAX_AGE_SECONDS });
  }
  
  async bust(key: string): Promise<void> {
    return withPerformanceLogging('cache.bust', 'cache', async () => {
      const result = await this.redis.del(key);
      
      logInfo('Cache busted', { key, existed: result > 0 });
    }, { key });
  }
  
  async bustPattern(pattern: string): Promise<number> {
    return withPerformanceLogging('cache.bustPattern', 'cache', async () => {
      // Use scan to find keys matching pattern
      const keys: string[] = [];
      let cursor = 0;
      
      do {
        const result = await this.redis.scan(cursor, { match: pattern, count: 100 });
        cursor = parseInt(result[0] as string);
        keys.push(...(result[1] as string[]));
      } while (cursor !== 0);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      logInfo('Cache pattern busted', { pattern, count: keys.length });
      return keys.length;
    }, { pattern });
  }
  
  async getStats(): Promise<{
    memory_usage: string;
    connected_clients: number;
    total_commands_processed: number;
  }> {
    // Upstash Redis doesn't support INFO command
    return {
      memory_usage: 'Not available',
      connected_clients: 0,
      total_commands_processed: 0
    };
  }
}

// Export singleton instance
export const cache = new KVCache();

// Pipedrive field IDs from legacy tech specs
const MINE_GROUP_FIELD_ID = 'd0b6b2d1d53bed3053e896f938c6051a790bd15e';
const JOB_TITLE_FIELD_ID = 'd84955e5e1a7284521f90bca9aa2b94a533ed24e';

// PRD-specific hierarchical transformation for contacts
export const transformContactsHierarchy = (persons: any[], organizations: any[]) => {
  const orgMap = new Map(organizations.map(org => [org.id, org]));
  
  const grouped = persons.reduce((acc, person) => {
    const org = orgMap.get(person.org_id?.value);
    // PRD requirement: Group by Mine Group > Mine Name > Persons
    // Use correct Pipedrive field ID from legacy tech specs
    const rawMineGroup = org?.[MINE_GROUP_FIELD_ID] || 'Unknown Group';
    const orgName = person.org_id?.name || 'Unknown Mine';
    
    const mineGroup = rawMineGroup;
    const mineName = orgName;
    
    if (!acc[mineGroup]) acc[mineGroup] = {};
    if (!acc[mineGroup][mineName]) acc[mineGroup][mineName] = [];
    
    acc[mineGroup][mineName].push({
      personId: person.id,
      name: person.name,
      email: person.email?.[0]?.value || null,
      phone: person.phone?.[0]?.value || null,
      orgId: person.org_id?.value,
      orgName: person.org_id?.name,
      mineGroup,
      mineName,
      jobTitle: person[JOB_TITLE_FIELD_ID] || null
    });
    
    return acc;
  }, {});
  
  return grouped;
};

// PRD-specific hierarchical transformation for products
export const transformProductsHierarchy = (products: any[]) => {
  // Category mapping based on actual Pipedrive category IDs to real category names
  const categoryMap: Record<string, string> = {
    '28': 'Cable',
    '29': 'Conveyor Belt Equipment',
    '30': 'Environmental Monitoring',
    '31': 'General Supplies',
    '32': 'Panel Accessories',
    '33': 'Rescue Bay Equipment',
    '34': 'General Supplies',
    '35': 'Rescue Bay Equipment',
    '36': 'General Supplies',
    '37': 'General Supplies',
    '80': 'New'
  };

  // Custom field IDs from legacy tech specs
  const SHORT_DESCRIPTION_FIELD_ID = 'f320da5e15bef8b83d8c9d997533107dfdb66d5c';
  const SHOW_ON_SALES_HELPER_FIELD_ID = '59af9d567fc57492de93e82653ce01d0c967f6f5';
  
  // Debug logging
  console.log('transformProductsHierarchy called with', products.length, 'products');
  

  
  return products.reduce((acc, product) => {
    const category = categoryMap[product.category as string] || 'Other';
    
    // Extract custom field values
    const shortDescription = product[SHORT_DESCRIPTION_FIELD_ID] || '';
    const showOnSalesHelperValue = product[SHOW_ON_SALES_HELPER_FIELD_ID];
    
    // Map "Show on Sales Helper" field: Custom dropdown field
    // Based on logs, 79 = "Yes", 78 = "No" (dropdown option IDs)
    const showOnSalesHelper = showOnSalesHelperValue === 79 || showOnSalesHelperValue === '79';
    

    
    // Only include products that should be shown on Sales Helper
    if (!showOnSalesHelper) {
      return acc;
    }
    
    if (!acc[category]) acc[category] = [];
    
    // Extract price from the prices array (first price entry)
    const price = product.prices && product.prices.length > 0 ? product.prices[0].price : 0;
    
    acc[category].push({
      pipedriveProductId: product.id,
      name: product.name,
      code: product.code,
      price: price,
      description: product.description || '',
      shortDescription: shortDescription,
      showOnSalesHelper: showOnSalesHelper
    });
    
    return acc;
  }, {});
};

// Cache key constants
export const CACHE_KEYS = {
  CONTACTS: 'contacts:hierarchical:v1',
  PRODUCTS: 'products:categorized:v1',
} as const;

// Cache warming function to pre-populate cache
export const warmCache = async () => {
  try {
    logInfo('Starting cache warming process');
    
    // Import here to avoid circular dependencies
    const { fetchContacts } = await import('./pipedrive');
    const { fetchProducts } = await import('./pipedrive');
    
    // Warm contacts cache
    try {
      const { persons, organizations } = await fetchContacts();
      const hierarchicalData = transformContactsHierarchy(persons, organizations);
      await cache.set(CACHE_KEYS.CONTACTS, hierarchicalData);
      logInfo('Contacts cache warmed successfully', { 
        personsCount: persons.length,
        organizationsCount: organizations.length
      });
    } catch (error) {
      logWarn('Failed to warm contacts cache', { error: (error as Error).message });
    }
    
    // Warm products cache
    try {
      const products = await fetchProducts();
      const categorizedData = transformProductsHierarchy(products);
      await cache.set(CACHE_KEYS.PRODUCTS, categorizedData);
      logInfo('Products cache warmed successfully', { 
        productsCount: products.length
      });
    } catch (error) {
      logWarn('Failed to warm products cache', { error: (error as Error).message });
    }
    
    logInfo('Cache warming process completed');
  } catch (error) {
    logError('Cache warming failed', { error: (error as Error).message });
  }
};
