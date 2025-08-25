import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  getCanonicalStageMappings, 
  getCanonicalStageMapping, 
  getDealsForCanonicalStage 
} from '../../lib/db';
import { sql } from '../../lib/db';

// Mock the database
vi.mock('../../lib/db', async () => {
  const actual = await vi.importActual('../../lib/db');
  return {
    ...actual,
    sql: vi.fn(),
    withDbErrorHandling: vi.fn((fn) => fn)
  };
});

describe('Canonical Stage Mappings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getCanonicalStageMappings', () => {
    it('should fetch all canonical stage mappings', async () => {
      const mockMappings = [
        {
          id: '1',
          canonical_stage: 'Order Conversion',
          start_stage: 'Order Received - Johan',
          end_stage: 'Quality Control',
          created_at: '2025-08-25T13:33:46.718Z',
          updated_at: '2025-08-25T13:33:46.718Z'
        },
        {
          id: '2',
          canonical_stage: 'Quote to Order',
          start_stage: 'Quote Sent',
          end_stage: 'Order Received - Johan',
          created_at: '2025-08-25T13:51:04.738Z',
          updated_at: '2025-08-25T13:51:04.738Z'
        }
      ];

      (sql as any).mockResolvedValue(mockMappings);

      const result = await getCanonicalStageMappings();

      expect(sql).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM canonical_stage_mappings ORDER BY canonical_stage')
      );
      expect(result).toEqual(mockMappings);
    });

    it('should handle empty results', async () => {
      (sql as any).mockResolvedValue([]);

      const result = await getCanonicalStageMappings();

      expect(result).toEqual([]);
    });
  });

  describe('getCanonicalStageMapping', () => {
    it('should fetch a specific canonical stage mapping', async () => {
      const mockMapping = {
        id: '1',
        canonical_stage: 'Order Conversion',
        start_stage: 'Order Received - Johan',
        end_stage: 'Quality Control',
        created_at: '2025-08-25T13:33:46.718Z',
        updated_at: '2025-08-25T13:33:46.718Z'
      };

      (sql as any).mockResolvedValue([mockMapping]);

      const result = await getCanonicalStageMapping('Order Conversion');

      expect(sql).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM canonical_stage_mappings'),
        expect.stringContaining('WHERE canonical_stage ='),
        'Order Conversion',
        expect.stringContaining('ORDER BY updated_at DESC'),
        expect.stringContaining('LIMIT 1')
      );
      expect(result).toEqual(mockMapping);
    });

    it('should return null when mapping not found', async () => {
      (sql as any).mockResolvedValue([]);

      const result = await getCanonicalStageMapping('Non Existent Stage');

      expect(result).toBeNull();
    });

    it('should select most recent mapping when multiple exist', async () => {
      const mockMappings = [
        {
          id: '2',
          canonical_stage: 'Order Conversion',
          start_stage: 'Order Received - Johan',
          end_stage: 'Quality Control',
          updated_at: '2025-08-25T13:54:57.483Z'
        },
        {
          id: '1',
          canonical_stage: 'Order Conversion',
          start_stage: 'Order Received - Johan',
          end_stage: 'Order Inv Paid',
          updated_at: '2025-08-25T13:51:13.834Z'
        }
      ];

      (sql as any).mockResolvedValue(mockMappings);

      const result = await getCanonicalStageMapping('Order Conversion');

      expect(result).toEqual(mockMappings[0]); // Should return the most recent one
    });
  });

  describe('getDealsForCanonicalStage', () => {
    it('should fetch deals for a canonical stage with correct mapping', async () => {
      const mockMapping = {
        id: '1',
        canonical_stage: 'Order Conversion',
        start_stage: 'Order Received - Johan',
        end_stage: 'Quality Control'
      };

      const mockDeals = [
        {
          deal_id: '1467',
          start_date: '2025-08-07T11:16:49.000Z',
          end_date: '2025-08-11T12:28:28.000Z',
          duration_seconds: 349899
        },
        {
          deal_id: '1375',
          start_date: '2025-08-04T10:59:43.000Z',
          end_date: '2025-08-06T05:23:25.000Z',
          duration_seconds: 152622
        }
      ];

      // Mock the getCanonicalStageMapping function
      const { getCanonicalStageMapping } = await import('../../lib/db');
      vi.mocked(getCanonicalStageMapping).mockResolvedValue(mockMapping);
      
      (sql as any).mockResolvedValue(mockDeals);

      const result = await getDealsForCanonicalStage('Order Conversion');

      expect(getCanonicalStageMapping).toHaveBeenCalledWith('Order Conversion');
      expect(sql).toHaveBeenCalledWith(
        expect.stringContaining('WITH deal_stages AS'),
        expect.stringContaining('Order Received - Johan'),
        expect.stringContaining('Quality Control')
      );
      expect(result).toEqual(mockDeals);
    });

    it('should return empty array when no mapping found', async () => {
      const { getCanonicalStageMapping } = await import('../../lib/db');
      vi.mocked(getCanonicalStageMapping).mockResolvedValue(null);

      const result = await getDealsForCanonicalStage('Non Existent Stage');

      expect(result).toEqual([]);
    });

    it('should handle deals with no matching stages', async () => {
      const mockMapping = {
        id: '1',
        canonical_stage: 'Order Conversion',
        start_stage: 'Order Received - Johan',
        end_stage: 'Quality Control'
      };

      const { getCanonicalStageMapping } = await import('../../lib/db');
      vi.mocked(getCanonicalStageMapping).mockResolvedValue(mockMapping);
      
      (sql as any).mockResolvedValue([]);

      const result = await getDealsForCanonicalStage('Order Conversion');

      expect(result).toEqual([]);
    });

    it('should filter out deals where end_date is before start_date', async () => {
      const mockMapping = {
        id: '1',
        canonical_stage: 'Order Conversion',
        start_stage: 'Order Received - Johan',
        end_stage: 'Quality Control'
      };

      const mockDeals = [
        {
          deal_id: '1467',
          start_date: '2025-08-07T11:16:49.000Z',
          end_date: '2025-08-11T12:28:28.000Z',
          duration_seconds: 349899
        },
        {
          deal_id: '1375',
          start_date: '2025-08-04T10:59:43.000Z',
          end_date: '2025-08-06T05:23:25.000Z',
          duration_seconds: 152622
        }
      ];

      const { getCanonicalStageMapping } = await import('../../lib/db');
      vi.mocked(getCanonicalStageMapping).mockResolvedValue(mockMapping);
      
      (sql as any).mockResolvedValue(mockDeals);

      const result = await getDealsForCanonicalStage('Order Conversion');

      expect(sql).toHaveBeenCalledWith(
        expect.stringContaining('WHERE e.end_date > s.start_date')
      );
      expect(result).toEqual(mockDeals);
    });
  });
});
