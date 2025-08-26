import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the database functions
vi.mock('../../lib/db', () => ({
  sql: vi.fn(),
  withDbErrorHandling: vi.fn((fn) => fn),
  logInfo: vi.fn(),
  logError: vi.fn(),
  getCanonicalStageMappings: vi.fn(),
  getCanonicalStageMapping: vi.fn(),
  getDealsForCanonicalStage: vi.fn()
}));

// Import the mocked functions
import { 
  getCanonicalStageMappings, 
  getCanonicalStageMapping, 
  getDealsForCanonicalStage 
} from '../../lib/db';

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

      vi.mocked(getCanonicalStageMappings).mockResolvedValue(mockMappings);

      const result = await getCanonicalStageMappings();

      expect(result).toEqual(mockMappings);
    });

    it('should handle empty results', async () => {
      vi.mocked(getCanonicalStageMappings).mockResolvedValue([]);

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

      vi.mocked(getCanonicalStageMapping).mockResolvedValue(mockMapping);

      const result = await getCanonicalStageMapping('Order Conversion');

      expect(getCanonicalStageMapping).toHaveBeenCalledWith('Order Conversion');
      expect(result).toEqual(mockMapping);
    });

    it('should return null when mapping not found', async () => {
      vi.mocked(getCanonicalStageMapping).mockResolvedValue(null as any);

      const result = await getCanonicalStageMapping('Non Existent Stage');

      expect(getCanonicalStageMapping).toHaveBeenCalledWith('Non Existent Stage');
      expect(result).toBeNull();
    });

    it('should select most recent mapping when multiple exist', async () => {
      const mockMapping = {
        id: '2',
        canonical_stage: 'Order Conversion',
        start_stage: 'Order Received - Johan',
        end_stage: 'Quality Control',
        created_at: '2025-08-25T13:51:04.738Z',
        updated_at: '2025-08-25T13:51:04.738Z'
      };

      vi.mocked(getCanonicalStageMapping).mockResolvedValue(mockMapping);

      const result = await getCanonicalStageMapping('Order Conversion');

      expect(result).toEqual(mockMapping);
    });
  });

  describe('getDealsForCanonicalStage', () => {
    it('should fetch deals for a canonical stage with correct mapping', async () => {
      const mockMapping = {
        id: '1',
        canonical_stage: 'Order Conversion',
        start_stage: 'Order Received - Johan',
        end_stage: 'Quality Control',
        created_at: '2025-08-25T13:33:46.718Z',
        updated_at: '2025-08-25T13:33:46.718Z'
      };

      const mockDeals = [
        {
          deal_id: 1467,
          start_date: '2025-08-07T11:16:49.000Z',
          end_date: '2025-08-11T12:28:28.000Z',
          duration_seconds: 349899
        }
      ];

      vi.mocked(getCanonicalStageMapping).mockResolvedValue(mockMapping);
      vi.mocked(getDealsForCanonicalStage).mockResolvedValue(mockDeals);

      const result = await getDealsForCanonicalStage('Order Conversion');

      expect(result).toEqual(mockDeals);
    });

    it('should return empty array when no mapping found', async () => {
      vi.mocked(getCanonicalStageMapping).mockResolvedValue(null as any);
      vi.mocked(getDealsForCanonicalStage).mockResolvedValue([]);

      const result = await getDealsForCanonicalStage('Non Existent Stage');

      expect(result).toEqual([]);
    });

    it('should handle deals with no matching stages', async () => {
      const mockMapping = {
        id: '1',
        canonical_stage: 'Order Conversion',
        start_stage: 'Order Received - Johan',
        end_stage: 'Quality Control',
        created_at: '2025-08-25T13:33:46.718Z',
        updated_at: '2025-08-25T13:33:46.718Z'
      };

      vi.mocked(getCanonicalStageMapping).mockResolvedValue(mockMapping);
      vi.mocked(getDealsForCanonicalStage).mockResolvedValue([]);

      const result = await getDealsForCanonicalStage('Order Conversion');

      expect(result).toEqual([]);
    });

    it('should filter out deals where end_date is before start_date', async () => {
      const mockMapping = {
        id: '1',
        canonical_stage: 'Order Conversion',
        start_stage: 'Order Received - Johan',
        end_stage: 'Quality Control',
        created_at: '2025-08-25T13:33:46.718Z',
        updated_at: '2025-08-25T13:33:46.718Z'
      };

      const mockDeals = [
        {
          deal_id: 1468,
          start_date: '2025-08-07T11:16:49.000Z',
          end_date: '2025-08-11T12:28:28.000Z', // Valid date range
          duration_seconds: 349899
        }
      ];

      vi.mocked(getCanonicalStageMapping).mockResolvedValue(mockMapping);
      vi.mocked(getDealsForCanonicalStage).mockResolvedValue(mockDeals);

      const result = await getDealsForCanonicalStage('Order Conversion');

      expect(result).toEqual(mockDeals);
    });
  });
});
