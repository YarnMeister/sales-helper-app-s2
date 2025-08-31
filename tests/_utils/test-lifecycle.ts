import { getTestDb, getTableName } from '../../lib/config/test-env';
import { getRedisConfig } from '../../lib/config/test-env';
import { dbRequestFactory, type TestRequestDB } from '../_factories';

export class TestDataManager {
  private db = getTestDb();
  private redis;
  private trackedIds: string[] = [];
  private trackedKeys: string[] = [];

  constructor() {
    const config = getRedisConfig();
    this.redis = config.redis;
  }

  // Seed a request and track it for cleanup
  async seedRequest(overrides: Partial<TestRequestDB> = {}): Promise<TestRequestDB> {
    const testRequest = dbRequestFactory.build(overrides);
    
    const result = await this.db`
      INSERT INTO ${this.db(getTableName('requests'))} 
      (id, request_id, status, salesperson_first_name, mine_group, mine_name, contact, line_items, comment, pipedrive_deal_id, created_at, updated_at)
      VALUES (
        ${testRequest.id}::uuid,
        ${testRequest.request_id},
        ${testRequest.status},
        ${testRequest.salesperson_first_name},
        ${testRequest.mine_group},
        ${testRequest.mine_name},
        ${JSON.stringify(testRequest.contact)}::jsonb,
        ${JSON.stringify(testRequest.line_items)}::jsonb,
        ${testRequest.comment},
        ${testRequest.pipedrive_deal_id},
        ${testRequest.created_at}::timestamp with time zone,
        ${testRequest.updated_at}::timestamp with time zone
      )
      RETURNING *
    `;

    if (!result || result.length === 0) {
      throw new Error('Failed to seed test request');
    }

    // Track for cleanup
    this.trackedIds.push(result[0].id);
    
    return result[0];
  }

  // Seed multiple requests
  async seedRequests(count: number, overrides: Partial<TestRequestDB> = {}): Promise<TestRequestDB[]> {
    const requests = await Promise.all(
      Array.from({ length: count }, () => this.seedRequest(overrides))
    );
    
    return requests;
  }

  // Seed cache data and track it
  async seedCache(key: string, data: any, ttl: number = 3600): Promise<void> {
    const config = getRedisConfig();
    const namespacedKey = config.getKey(key);
    
    await this.redis.setex(namespacedKey, ttl, JSON.stringify({
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000
    }));
    
    // Track for cleanup
    this.trackedKeys.push(namespacedKey);
  }

  // Clean up all tracked data
  async cleanup(): Promise<void> {
    try {
      // Clean up database records
      if (this.trackedIds.length > 0) {
        await this.db`
          DELETE FROM ${this.db(getTableName('requests'))}
          WHERE id = ANY(${this.trackedIds}::uuid[])
        `;
        
        // Note: mockSubmissions table no longer exists after mock table cleanup
        // await this.db`
        //   DELETE FROM ${this.db(getTableName('mockSubmissions'))}
        //   WHERE request_id = ANY(${this.trackedIds})
        // `;
      }

      // Clean up Redis keys
      if (this.trackedKeys.length > 0) {
        await this.redis.del(...this.trackedKeys);
      }

      // Reset tracking
      this.trackedIds = [];
      this.trackedKeys = [];
      
    } catch (error) {
      console.warn('Cleanup warning:', error);
      // Don't throw - cleanup should be best effort
    }
  }

  // Nuclear cleanup - removes ALL test data (use carefully)
  async nuclearCleanup(): Promise<void> {
    try {
      // Clean all test tables
      await this.db`DELETE FROM ${this.db(getTableName('requests'))} WHERE id IS NOT NULL`;
      await this.db`DELETE FROM ${this.db(getTableName('kvCache'))} WHERE key IS NOT NULL`;
      // Note: mockSubmissions table no longer exists after mock table cleanup
      // await this.db`DELETE FROM ${this.db(getTableName('mockSubmissions'))} WHERE id IS NOT NULL`;

      // Clean all test Redis keys
      const config = getRedisConfig();
      const pattern = config.getKey('*');
      const keys = await this.redis.keys(pattern);
      
      if (keys && keys.length > 0) {
        await this.redis.del(...keys);
      }
      
    } catch (error) {
      console.warn('Nuclear cleanup warning:', error);
    }
  }
}
