import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/flow/metrics/route';
import { getActiveFlowMetricsConfig, getDealsForCanonicalStage } from '../../lib/db';

// Mock the database functions
vi.mock('../../lib/db', () => ({
  getActiveFlowMetricsConfig: vi.fn(),
  getDealsForCanonicalStage: vi.fn(),
}));

// Mock the logging functions
vi.mock('../../lib/log', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

describe('Flow Metrics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/flow/metrics', () => {
    it('should return calculated metrics for active canonical stages', async () => {
      // Mock active metrics configuration
      const mockActiveMetrics = [
        {
          metric_key: 'manufacturing',
          display_title: 'Manufacturing Lead Time',
          canonical_stage: 'Manufacturing',
        },
        {
          metric_key: 'delivery',
          display_title: 'Delivery Lead Time',
          canonical_stage: 'Delivery',
        },
      ];

      // Mock deals data for manufacturing
      const mockManufacturingDeals = [
        {
          deal_id: 'M1',
          start_date: '2024-01-15T00:00:00.000Z',
          end_date: '2024-01-19T00:00:00.000Z',
          duration_seconds: 345600, // 4 days
        },
        {
          deal_id: 'M2',
          start_date: '2024-01-15T00:00:00.000Z',
          end_date: '2024-01-22T00:00:00.000Z',
          duration_seconds: 604800, // 7 days
        },
      ];

      // Mock empty deals for delivery
      const mockDeliveryDeals: any[] = [];

      vi.mocked(getActiveFlowMetricsConfig).mockResolvedValue(mockActiveMetrics);
      vi.mocked(getDealsForCanonicalStage)
        .mockResolvedValueOnce(mockManufacturingDeals) // First call for manufacturing
        .mockResolvedValueOnce(mockDeliveryDeals); // Second call for delivery

      // Create request with period parameter
      const request = new NextRequest('http://localhost:3000/api/flow/metrics?period=7d');

      const response = await GET(request);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      // Check manufacturing metrics
      const manufacturingMetric = result.data.find((m: any) => m.id === 'manufacturing');
      expect(manufacturingMetric).toEqual({
        id: 'manufacturing',
        title: 'Manufacturing Lead Time',
        canonicalStage: 'Manufacturing',
        mainMetric: '6', // (4 + 7) / 2 = 5.5, rounded to 6
        best: '4',
        worst: '7',
        totalDeals: 2,
        trend: 'stable',
      });

      // Check delivery metrics (no deals)
      const deliveryMetric = result.data.find((m: any) => m.id === 'delivery');
      expect(deliveryMetric).toEqual({
        id: 'delivery',
        title: 'Delivery Lead Time',
        canonicalStage: 'Delivery',
        mainMetric: '0',
        best: '0',
        worst: '0',
        totalDeals: 0,
        trend: 'stable',
      });
    });

    it('should handle empty active metrics', async () => {
      vi.mocked(getActiveFlowMetricsConfig).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/flow/metrics?period=7d');
      const response = await GET(request);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('No active metrics found');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(getActiveFlowMetricsConfig).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/flow/metrics?period=7d');
      const response = await GET(request);
      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to calculate flow metrics');
      expect(response.status).toBe(500);
    });

    it('should handle individual metric calculation errors', async () => {
      const mockActiveMetrics = [
        {
          metric_key: 'test-metric',
          display_title: 'Test Metric',
          canonical_stage: 'Test Stage',
        },
      ];

      vi.mocked(getActiveFlowMetricsConfig).mockResolvedValue(mockActiveMetrics);
      vi.mocked(getDealsForCanonicalStage).mockRejectedValue(new Error('Calculation error'));

      const request = new NextRequest('http://localhost:3000/api/flow/metrics?period=7d');
      const response = await GET(request);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);

      const testMetric = result.data[0];
      expect(testMetric).toEqual({
        id: 'test-metric',
        title: 'Test Metric',
        canonicalStage: 'Test Stage',
        mainMetric: 'N/A',
        best: 'N/A',
        worst: 'N/A',
        totalDeals: 0,
        trend: 'stable',
      });
    });

    it('should use default period when not provided', async () => {
      const mockActiveMetrics = [
        {
          metric_key: 'test-metric',
          display_title: 'Test Metric',
          canonical_stage: 'Test Stage',
        },
      ];

      vi.mocked(getActiveFlowMetricsConfig).mockResolvedValue(mockActiveMetrics);
      vi.mocked(getDealsForCanonicalStage).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/flow/metrics');
      const response = await GET(request);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });
});
