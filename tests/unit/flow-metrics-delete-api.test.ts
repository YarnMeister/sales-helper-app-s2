import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE } from '../../app/api/admin/flow-metrics-config/[id]/route';
import { deleteFlowMetricConfig } from '../../lib/db';

// Mock the database functions
vi.mock('../../lib/db', () => ({
  deleteFlowMetricConfig: vi.fn(),
}));

// Mock the logging functions
vi.mock('../../lib/log', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

// Mock NextResponse
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((data, options) => ({ data, options }))
    }
  };
});

describe('Flow Metrics Delete API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('DELETE /api/admin/flow-metrics-config/[id]', () => {
    it('should successfully delete a metric configuration', async () => {
      const mockDeletedMetric = {
        id: 'test-metric-id',
        metric_key: 'test-metric',
        display_title: 'Test Metric',
        canonical_stage: 'Test Stage',
        sort_order: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      vi.mocked(deleteFlowMetricConfig).mockResolvedValue(mockDeletedMetric);

      const request = new NextRequest('http://localhost:3000/api/admin/flow-metrics-config/test-metric-id');
      const response = await DELETE(request, { params: { id: 'test-metric-id' } });

      expect(deleteFlowMetricConfig).toHaveBeenCalledWith('test-metric-id');
      expect(response).toEqual({
        data: {
          success: true,
          data: mockDeletedMetric
        },
        options: undefined
      });
    });

    it('should handle metric not found', async () => {
      vi.mocked(deleteFlowMetricConfig).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/flow-metrics-config/non-existent-id');
      const response = await DELETE(request, { params: { id: 'non-existent-id' } });

      expect(response).toEqual({
        data: {
          success: false,
          error: 'Flow metric configuration not found'
        },
        options: { status: 404 }
      });
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(deleteFlowMetricConfig).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/flow-metrics-config/test-metric-id');
      const response = await DELETE(request, { params: { id: 'test-metric-id' } });

      expect(response).toEqual({
        data: {
          success: false,
          error: 'Failed to delete flow metric configuration'
        },
        options: { status: 500 }
      });
    });
  });
});
