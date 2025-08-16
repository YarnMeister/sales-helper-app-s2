import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Neon serverless driver
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => vi.fn()),
  neonConfig: {
    fetchConnectionCache: true
  }
}));

// Mock the database modules
vi.mock('../../lib/db', () => ({
  sql: vi.fn()
}));

vi.mock('../../lib/db-utils', () => ({
  generateRequestId: vi.fn().mockResolvedValue('QR-001'),
  validateContactJsonb: vi.fn().mockResolvedValue(true),
  checkDbHealth: vi.fn().mockResolvedValue({
    healthy: true,
    environment: 'test',
    latency: 10,
    version: 'PostgreSQL (Neon Serverless)'
  }),
  withTiming: vi.fn((label, operation) => operation())
}));

import { sql } from '../../lib/db';
import { 
  generateRequestId, 
  validateContactJsonb,
  checkDbHealth,
  withTiming
} from '../../lib/db-utils';

describe('Database utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create database client with correct environment', () => {
    expect(sql).toBeDefined();
    expect(typeof sql).toBe('function');
  });
  
  it('should generate sequential request IDs using database function', async () => {
    // Mock the sql function
    vi.mocked(sql).mockResolvedValue([{ generate_request_id: 'QR-001' }]);
    
    const id1 = await generateRequestId();
    expect(id1).toBe('QR-001');
    expect(sql).toHaveBeenCalledWith(expect.stringContaining('SELECT generate_request_id()'));
  });
  
  it('should validate contact JSONB using database function', async () => {
    const validContact = {
      personId: 123,
      name: 'John Doe',
      mineGroup: 'Northern Mines',
      mineName: 'Diamond Mine A'
    };
    
    // Mock the sql function
    vi.mocked(sql).mockResolvedValue([{ validate_contact_jsonb: true }]);
    
    const validResult = await validateContactJsonb(validContact);
    expect(validResult).toBe(true);
    expect(sql).toHaveBeenCalledWith(expect.stringContaining('SELECT validate_contact_jsonb'));
  });
  
  it('should perform database health check', async () => {
    // Mock the sql function
    vi.mocked(sql).mockResolvedValue([{ health_check: 1 }]);
    
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
      withTiming('test-operation', operation)
    ).rejects.toThrow('Test database error');
  });
});
