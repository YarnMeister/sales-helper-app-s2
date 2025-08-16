import { describe, it, expect, beforeAll } from 'vitest';

// Skip integration tests if environment is not properly configured
const runIntegrationTests = process.env.DATABASE_URL && process.env.REDIS_URL && process.env.PIPEDRIVE_API_TOKEN;

describe('Database Integration', () => {
  beforeAll(() => {
    if (!runIntegrationTests) {
      console.log('Skipping integration tests - environment not configured');
    }
  });
  
  it('should connect to correct database based on environment', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping test - environment not configured');
      return;
    }
    
    const { getDb, checkDbHealth, generateRequestId, validateContactJsonb } = await import('../../lib/db');
    const health = await checkDbHealth();
    expect(health.healthy).toBe(true);
    expect(health.latency).toBeGreaterThan(0);
    expect(health.environment).toBeDefined();
  });
  
  it('should generate unique request IDs using database function', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping test - environment not configured');
      return;
    }
    
    const { getDb, checkDbHealth, generateRequestId, validateContactJsonb } = await import('../../lib/db');
    const ids = await Promise.all([
      generateRequestId(),
      generateRequestId(),
      generateRequestId()
    ]);
    
    // All should be unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
    
    // All should follow format
    ids.forEach(id => {
      expect(id).toMatch(/^QR-\d{3}$/);
    });
  });
  
  it('should validate contact JSONB with database function', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping test - environment not configured');
      return;
    }
    
    const { getDb, checkDbHealth, generateRequestId, validateContactJsonb } = await import('../../lib/db');
    const validContact = {
      personId: 123,
      name: 'Test Contact',
      mineGroup: 'Test Mine Group',
      mineName: 'Test Mine Name'
    };
    
    const result = await validateContactJsonb(validContact);
    expect(result).toBe(true);
  });
  
  it('should reject invalid contact JSONB', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping test - environment not configured');
      return;
    }
    
    const { getDb, checkDbHealth, generateRequestId, validateContactJsonb } = await import('../../lib/db');
    const invalidContact = {
      name: 'Test Contact'
      // Missing required fields
    };
    
    const result = await validateContactJsonb(invalidContact);
    expect(result).toBe(false);
  });
  
  it('should test salesperson constraint in database', async () => {
    if (!runIntegrationTests) {
      console.log('Skipping test - environment not configured');
      return;
    }
    
    const { getDb, checkDbHealth, generateRequestId, validateContactJsonb } = await import('../../lib/db');
    const db = getDb();
    const client = await db.connect();
    
    try {
      // Test valid salesperson
      const validData = {
        salesperson_selection: 'Luyanda',
        status: 'draft' as const,
        line_items: []
      };
      
      const { rows: validRows, rowCount: validCount } = await client.query(
        'INSERT INTO requests (salesperson_selection, status, line_items) VALUES ($1, $2, $3) RETURNING id',
        [validData.salesperson_selection, validData.status, JSON.stringify(validData.line_items)]
      );
      
      expect(validCount).toBe(1);
      
      // Clean up
      await client.query('DELETE FROM requests WHERE id = $1', [validRows[0].id]);
      
      // Test invalid salesperson (should fail constraint)
      await expect(
        client.query(
          'INSERT INTO requests (salesperson_selection, status, line_items) VALUES ($1, $2, $3)',
          ['InvalidName', 'draft', JSON.stringify([])]
        )
      ).rejects.toThrow();
      
    } finally {
      client.release();
    }
  });
});
