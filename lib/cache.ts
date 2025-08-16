import { Redis } from '@upstash/redis';
import { getCacheConfig } from './env';

// Create Redis client
let redis: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redis) {
    const config = getCacheConfig();
    
    redis = new Redis({
      url: config.url,
      automaticDeserialization: true, // Automatically parse JSON
    });
    
    console.log(`Redis client created for ${config.environment} environment`);
  }
  
  return redis;
};

// Cache configuration
const CACHE_MAX_AGE_SECONDS = 24 * 60 * 60; // 24 hours
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
    try {
      const startTime = Date.now();
      
      // Get data and TTL in a pipeline for efficiency
      const pipeline = this.redis.pipeline();
      pipeline.get(key);
      pipeline.ttl(key);
      
      const [data, ttl] = await pipeline.exec() as [T | null, number];
      
      const latency = Date.now() - startTime;
      
      if (data === null) {
        console.log(`Cache miss`, { key, latency: `${latency}ms` });
        return null;
      }
      
      const now = Date.now();
      const timestamp = (data as any)?.timestamp || now;
      const age = now - timestamp;
      const isStale = ttl < 0 || age > CACHE_MAX_AGE_SECONDS * 1000;
      
      console.log(`Cache ${isStale ? 'stale hit' : 'hit'}`, { 
        key, 
        latency: `${latency}ms`,
        age_hours: age / (1000 * 60 * 60),
        ttl_seconds: ttl
      });
      
      return {
        data: (data as any)?.data || data,
        timestamp,
        ttl,
        stale: isStale,
        source: 'redis'
      };
    } catch (error) {
      console.error('Cache get error', { key, error: (error as Error).message });
      return null;
    }
  }
  
  async set<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const cacheValue = {
        data: value,
        timestamp: Date.now()
      };
      
      const ttl = ttlSeconds || CACHE_MAX_AGE_SECONDS;
      
      await this.redis.setex(key, ttl, cacheValue);
      
      console.log('Cache set', { 
        key, 
        ttl_seconds: ttl,
        size_estimate: JSON.stringify(cacheValue).length 
      });
    } catch (error) {
      console.error('Cache set error', { key, error: (error as Error).message });
      throw error;
    }
  }
  
  async bust(key: string): Promise<void> {
    try {
      const result = await this.redis.del(key);
      
      console.log('Cache busted', { key, existed: result > 0 });
    } catch (error) {
      console.error('Cache bust error', { key, error: (error as Error).message });
    }
  }
  
  async bustPattern(pattern: string): Promise<number> {
    try {
      // Use scan to find keys matching pattern
      const keys: string[] = [];
      let cursor = 0;
      
      do {
        const result = await this.redis.scan(cursor, { match: pattern, count: 100 });
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== 0);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      console.log('Cache pattern busted', { pattern, count: keys.length });
      return keys.length;
    } catch (error) {
      console.error('Cache pattern bust error', { pattern, error: (error as Error).message });
      return 0;
    }
  }
  
  async getStats(): Promise<{
    memory_usage: string;
    connected_clients: number;
    total_commands_processed: number;
  }> {
    try {
      const info = await this.redis.info();
      
      // Parse Redis INFO response
      const stats = {
        memory_usage: 'Unknown',
        connected_clients: 0,
        total_commands_processed: 0
      };
      
      if (typeof info === 'string') {
        const lines = info.split('\r\n');
        for (const line of lines) {
          if (line.startsWith('used_memory_human:')) {
            stats.memory_usage = line.split(':')[1];
          } else if (line.startsWith('connected_clients:')) {
            stats.connected_clients = parseInt(line.split(':')[1], 10);
          } else if (line.startsWith('total_commands_processed:')) {
            stats.total_commands_processed = parseInt(line.split(':')[1], 10);
          }
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Cache stats error', { error: (error as Error).message });
      return {
        memory_usage: 'Error',
        connected_clients: 0,
        total_commands_processed: 0
      };
    }
  }
}

// Export singleton instance
export const cache = new KVCache();

// PRD-specific hierarchical transformation for contacts
export const transformContactsHierarchy = (persons: any[], organizations: any[]) => {
  const orgMap = new Map(organizations.map(org => [org.id, org]));
  
  const grouped = persons.reduce((acc, person) => {
    const org = orgMap.get(person.org_id?.value);
    // PRD requirement: Group by Mine Group > Mine Name > Persons
    const mineGroup = org?.['your_mine_group_field_id'] || 'Unknown Group';
    const mineName = person.org_id?.name || 'Unknown Mine';
    
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
      mineName
    });
    
    return acc;
  }, {});
  
  return grouped;
};

// PRD-specific hierarchical transformation for products
export const transformProductsHierarchy = (products: any[]) => {
  const categoryMap = {
    '1': 'Safety Equipment',
    '2': 'Mining Tools',
    '3': 'Personal Protective Equipment',
    '4': 'Machinery Parts'
  };
  
  return products.reduce((acc, product) => {
    const category = categoryMap[product.category] || 'Other';
    
    if (!acc[category]) acc[category] = [];
    
    acc[category].push({
      pipedriveProductId: product.id,
      name: product.name,
      code: product.code,
      price: product.price || 0,
      shortDescription: product.description || ''
    });
    
    return acc;
  }, {});
};

// Cache key constants
export const CACHE_KEYS = {
  CONTACTS: 'contacts:hierarchical:v1',
  PRODUCTS: 'products:categorized:v1',
} as const;
