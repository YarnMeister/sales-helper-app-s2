import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getFlowMetricsConfig, 
  getActiveFlowMetricsConfig, 
  createFlowMetricConfig, 
  updateFlowMetricConfig,
  updateFlowMetricComment,
  deleteFlowMetricConfig 
} from '../../lib/db';

// Mock the database module
vi.mock('../../lib/db', async () => {
  const actual = await vi.importActual('../../lib/db');
  return {
    ...actual,
    neon: vi.fn(() => ({
      sql: vi.fn()
    }))
  };
});

describe('Flow Metrics Database Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFlowMetricsConfig', () => {
    it('should fetch all flow metrics with new fields', async () => {
      const mockData = [
        {
          id: '1',
          metric_key: 'lead-conversion',
          display_title: 'Lead Conversion Time',
          canonical_stage: 'Lead Conversion',
          sort_order: 1,
          is_active: true,
          start_stage_id: 100,
          end_stage_id: 200,
          avg_min_days: 5,
          avg_max_days: 15,
          metric_comment: 'Good performance',
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        }
      ];

      // Mock the database query
      const { neon } = await import('@neondatabase/serverless');
      const mockSql = vi.fn().mockResolvedValue(mockData);
      vi.mocked(neon).mockReturnValue(mockSql as any);

      const result = await getFlowMetricsConfig();

      expect(result).toEqual(mockData);
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('avg_min_days'));
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('avg_max_days'));
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('metric_comment'));
    });
  });

  describe('getActiveFlowMetricsConfig', () => {
    it('should fetch only active flow metrics with new fields', async () => {
      const mockData = [
        {
          id: '1',
          metric_key: 'lead-conversion',
          display_title: 'Lead Conversion Time',
          canonical_stage: 'Lead Conversion',
          sort_order: 1,
          is_active: true,
          start_stage_id: 100,
          end_stage_id: 200,
          avg_min_days: 5,
          avg_max_days: 15,
          metric_comment: 'Good performance',
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        }
      ];

      // Mock the database query
      const { neon } = await import('@neondatabase/serverless');
      const mockSql = vi.fn().mockResolvedValue(mockData);
      vi.mocked(neon).mockReturnValue(mockSql as any);

      const result = await getActiveFlowMetricsConfig();

      expect(result).toEqual(mockData);
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('WHERE fmc.is_active = true'));
    });
  });

  describe('createFlowMetricConfig', () => {
    it('should create flow metric with threshold and comment fields', async () => {
      const createData = {
        metric_key: 'test-metric',
        display_title: 'Test Metric',
        canonical_stage: 'Test Stage',
        sort_order: 1,
        is_active: true,
        start_stage_id: 100,
        end_stage_id: 200,
        avg_min_days: 5,
        avg_max_days: 15,
        metric_comment: 'Test comment'
      };

      const mockResult = {
        id: '1',
        ...createData,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      // Mock the database queries
      const { neon } = await import('@neondatabase/serverless');
      const mockSql = vi.fn()
        .mockResolvedValueOnce([mockResult]) // First call for config insert
        .mockResolvedValueOnce([mockResult]); // Second call for mapping insert
      vi.mocked(neon).mockReturnValue(mockSql as any);

      const result = await createFlowMetricConfig(createData);

      expect(result).toEqual(mockResult);
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO canonical_stage_mappings'));
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('avg_min_days'));
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('avg_max_days'));
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('metric_comment'));
    });

    it('should create flow metric without threshold and comment fields', async () => {
      const createData = {
        metric_key: 'test-metric',
        display_title: 'Test Metric',
        canonical_stage: 'Test Stage',
        sort_order: 1,
        is_active: true
      };

      const mockResult = {
        id: '1',
        ...createData,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      // Mock the database query
      const { neon } = await import('@neondatabase/serverless');
      const mockSql = vi.fn().mockResolvedValue([mockResult]);
      vi.mocked(neon).mockReturnValue(mockSql as any);

      const result = await createFlowMetricConfig(createData);

      expect(result).toEqual(mockResult);
      // Should not call mapping insert since no stage IDs provided
      expect(mockSql).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO canonical_stage_mappings'));
    });
  });

  describe('updateFlowMetricConfig', () => {
    it('should update flow metric with threshold and comment fields', async () => {
      const updateData = {
        display_title: 'Updated Metric',
        avg_min_days: 3,
        avg_max_days: 20,
        metric_comment: 'Updated comment'
      };

      const mockResult = {
        id: '1',
        metric_key: 'test-metric',
        display_title: 'Updated Metric',
        canonical_stage: 'Test Stage',
        sort_order: 1,
        is_active: true,
        start_stage_id: 100,
        end_stage_id: 200,
        avg_min_days: 3,
        avg_max_days: 20,
        metric_comment: 'Updated comment',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      // Mock the database queries
      const { neon } = await import('@neondatabase/serverless');
      const mockSql = vi.fn()
        .mockResolvedValueOnce([{ id: '1' }]) // Check if mapping exists
        .mockResolvedValueOnce([mockResult]); // Update mapping
      vi.mocked(neon).mockReturnValue(mockSql as any);

      const result = await updateFlowMetricConfig('1', updateData);

      expect(result).toEqual(mockResult);
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('UPDATE canonical_stage_mappings'));
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('avg_min_days'));
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('avg_max_days'));
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('metric_comment'));
    });

    it('should create mapping if it does not exist', async () => {
      const updateData = {
        start_stage_id: 100,
        end_stage_id: 200,
        avg_min_days: 5,
        avg_max_days: 15
      };

      const mockResult = {
        id: '1',
        metric_key: 'test-metric',
        display_title: 'Test Metric',
        canonical_stage: 'Test Stage',
        sort_order: 1,
        is_active: true,
        start_stage_id: 100,
        end_stage_id: 200,
        avg_min_days: 5,
        avg_max_days: 15,
        metric_comment: null,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      // Mock the database queries
      const { neon } = await import('@neondatabase/serverless');
      const mockSql = vi.fn()
        .mockResolvedValueOnce([]) // No existing mapping
        .mockResolvedValueOnce([mockResult]); // Insert new mapping
      vi.mocked(neon).mockReturnValue(mockSql as any);

      const result = await updateFlowMetricConfig('1', updateData);

      expect(result).toEqual(mockResult);
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO canonical_stage_mappings'));
    });
  });

  describe('updateFlowMetricComment', () => {
    it('should update only the comment field', async () => {
      const comment = 'Updated comment text';
      const mockResult = {
        id: '1',
        metric_key: 'test-metric',
        display_title: 'Test Metric',
        canonical_stage: 'Test Stage',
        sort_order: 1,
        is_active: true,
        start_stage_id: 100,
        end_stage_id: 200,
        avg_min_days: 5,
        avg_max_days: 15,
        metric_comment: comment,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      // Mock the database queries
      const { neon } = await import('@neondatabase/serverless');
      const mockSql = vi.fn()
        .mockResolvedValueOnce([{ id: '1' }]) // Check if mapping exists
        .mockResolvedValueOnce([mockResult]); // Update comment
      vi.mocked(neon).mockReturnValue(mockSql as any);

      const result = await updateFlowMetricComment('1', comment);

      expect(result).toEqual(mockResult);
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('UPDATE canonical_stage_mappings'));
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('metric_comment'));
    });

    it('should create mapping with comment if it does not exist', async () => {
      const comment = 'New comment text';
      const mockResult = {
        id: '1',
        metric_key: 'test-metric',
        display_title: 'Test Metric',
        canonical_stage: 'Test Stage',
        sort_order: 1,
        is_active: true,
        start_stage_id: null,
        end_stage_id: null,
        avg_min_days: null,
        avg_max_days: null,
        metric_comment: comment,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      // Mock the database queries
      const { neon } = await import('@neondatabase/serverless');
      const mockSql = vi.fn()
        .mockResolvedValueOnce([]) // No existing mapping
        .mockResolvedValueOnce([mockResult]); // Insert new mapping
      vi.mocked(neon).mockReturnValue(mockSql as any);

      const result = await updateFlowMetricComment('1', comment);

      expect(result).toEqual(mockResult);
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO canonical_stage_mappings'));
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('metric_comment'));
    });
  });

  describe('deleteFlowMetricConfig', () => {
    it('should delete flow metric and its mapping', async () => {
      const mockResult = {
        id: '1',
        metric_key: 'test-metric',
        display_title: 'Test Metric',
        canonical_stage: 'Test Stage',
        sort_order: 1,
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      // Mock the database queries
      const { neon } = await import('@neondatabase/serverless');
      const mockSql = vi.fn()
        .mockResolvedValueOnce([]) // Delete mapping
        .mockResolvedValueOnce([mockResult]); // Delete config
      vi.mocked(neon).mockReturnValue(mockSql as any);

      const result = await deleteFlowMetricConfig('1');

      expect(result).toEqual(mockResult);
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM canonical_stage_mappings'));
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM flow_metrics_config'));
    });
  });
});
