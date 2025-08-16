import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the environment validation
vi.mock('../../lib/env', () => ({
  getDatabaseConfig: vi.fn().mockReturnValue({
    url: 'postgresql://test:test@localhost:5432/test',
    environment: 'test'
  })
}));

// Mock the database connection
vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue({
      query: vi.fn(),
      release: vi.fn()
    })
  }))
}));

import { 
  getDb, 
  generateRequestId, 
  validateContactJsonb,
  checkDbHealth,
  kvGet,
  kvSet,
  withDbErrorHandling 
} from '../../lib/db';

describe('Database utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create database client with correct environment', () => {
    const db = getDb();
    expect(db).toBeDefined();
  });
  
  it('should generate sequential request IDs using database function', async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({
        rows: [{ generate_request_id: 'QR-001' }]
      }),
      release: vi.fn()
    };
    
    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient)
    };
    
    // Mock the Pool constructor to return our mock pool
    const { Pool } = await import('pg');
    vi.mocked(Pool).mockImplementation(() => mockPool as any);
    
    const id1 = await generateRequestId();
    expect(id1).toBe('QR-001');
    expect(mockClient.query).toHaveBeenCalledWith('SELECT generate_request_id()');
  });
  
  it('should validate contact JSONB using database function', async () => {
    const validContact = {
      personId: 123,
      name: 'John Doe',
      mineGroup: 'Northern Mines',
      mineName: 'Diamond Mine A'
    };
    
    const mockClient = {
      query: vi.fn().mockResolvedValue({
        rows: [{ validate_contact_jsonb: true }]
      }),
      release: vi.fn()
    };
    
    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient)
    };
    
    // Mock the Pool constructor to return our mock pool
    const { Pool } = await import('pg');
    vi.mocked(Pool).mockImplementation(() => mockPool as any);
    
    const validResult = await validateContactJsonb(validContact);
    expect(validResult).toBe(true);
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT validate_contact_jsonb($1)',
      [JSON.stringify(validContact)]
    );
  });
  
  it('should perform database health check', async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({
        rows: [{ health_check: 1 }]
      }),
      release: vi.fn()
    };
    
    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient)
    };
    
    // Mock the Pool constructor to return our mock pool
    const { Pool } = await import('pg');
    vi.mocked(Pool).mockImplementation(() => mockPool as any);
    
    const health = await checkDbHealth();
    expect(health).toHaveProperty('healthy');
    expect(health).toHaveProperty('environment');
    expect(health.healthy).toBe(true);
    expect(health.latency).toBeGreaterThanOrEqual(0);
  });
  
  it('should handle database errors properly', async () => {
    const operation = async () => {
      throw new Error('Test database error');
    };
    
    await expect(
      withDbErrorHandling(operation, 'test-operation')
    ).rejects.toThrow('Database operation failed: test-operation');
  });
  
  describe('KV Cache', () => {
    it('should set and get values', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test', number: 42 };
      
      const mockClient = {
        query: vi.fn()
          .mockResolvedValueOnce({ rows: [] }) // kvSet
          .mockResolvedValueOnce({ rows: [{ value: testValue }] }), // kvGet
        release: vi.fn()
      };
      
      const mockPool = {
        connect: vi.fn().mockResolvedValue(mockClient)
      };
      
      // Mock the Pool constructor to return our mock pool
      const { Pool } = await import('pg');
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      await kvSet(testKey, testValue);
      const retrieved = await kvGet(testKey);
      
      expect(retrieved).toEqual(testValue);
    });
    
    it('should return null for non-existent keys', async () => {
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
        release: vi.fn()
      };
      
      const mockPool = {
        connect: vi.fn().mockResolvedValue(mockClient)
      };
      
      // Mock the Pool constructor to return our mock pool
      const { Pool } = await import('pg');
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const result = await kvGet('non-existent-key');
      expect(result).toBeNull();
    });
  });
});
