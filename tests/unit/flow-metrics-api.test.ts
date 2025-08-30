import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/flow/metrics/route';
import { getActiveFlowMetricsConfig, getDealsForCanonicalStage } from '../../lib/db';
import {
  flowMetricWithMappingFactory,
  canonicalStageDealFactory,
  TEST_DATA_SETS
} from '../_factories/flow-metrics-factory';

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
      // Use factory to create realistic test data with mappings
      const manufacturingMetric = flowMetricWithMappingFactory.buildManufacturing();
      const deliveryMetric = flowMetricWithMappingFactory.build({
        metric_key: 'delivery',
        display_title: 'Delivery Lead Time',
        canonical_stage: 'Delivery',
        sort_order: 5
      });

      const mockActiveMetrics = [manufacturingMetric, deliveryMetric];

      // Use factory to create realistic deals data
      const mockManufacturingDeals = [
        canonicalStageDealFactory.buildWithDuration(4, { deal_id: 'M1' }),
        canonicalStageDealFactory.buildWithDuration(7, { deal_id: 'M2' })
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

      // Check manufacturing metrics - API uses factory-generated id
      const manufacturingResult = result.data.find((m: any) => m.id === manufacturingMetric.id);
      expect(manufacturingResult).toBeDefined();
      expect(manufacturingResult).toEqual({
        id: manufacturingMetric.id,
        title: 'Manufacturing Lead Time',
        canonicalStage: 'Manufacturing',
        mainMetric: '6', // (4 + 7) / 2 = 5.5, rounded to 6
        totalDeals: 2,
        avg_min_days: manufacturingMetric.avg_min_days,
        avg_max_days: manufacturingMetric.avg_max_days,
        metric_comment: manufacturingMetric.metric_comment,
      });

      // Check delivery metrics (no deals)
      const deliveryResult = result.data.find((m: any) => m.id === deliveryMetric.id);
      expect(deliveryResult).toEqual({
        id: deliveryMetric.id,
        title: 'Delivery Lead Time',
        canonicalStage: 'Delivery',
        mainMetric: '0',
        totalDeals: 0,
        avg_min_days: deliveryMetric.avg_min_days,
        avg_max_days: deliveryMetric.avg_max_days,
        metric_comment: deliveryMetric.metric_comment,
      });
    });

    it('should handle performance variation scenarios', async () => {
      // Use factory to create metrics with performance variation
      const metric = flowMetricWithMappingFactory.buildLeadConversion();
      const mockActiveMetrics = [metric];

      // Use factory to create deals with varying performance
      const { deals } = TEST_DATA_SETS.PERFORMANCE_VARIATION();
      const mockDeals = deals.slice(0, 3); // Use first 3 deals for testing

      vi.mocked(getActiveFlowMetricsConfig).mockResolvedValue(mockActiveMetrics);
      vi.mocked(getDealsForCanonicalStage).mockResolvedValue(mockDeals);

      const request = new NextRequest('http://localhost:3000/api/flow/metrics?period=7d');
      const response = await GET(request);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);

      const metricResult = result.data[0];
      expect(metricResult.totalDeals).toBe(3);
      expect(metricResult.mainMetric).toBeDefined();
      expect(metricResult.avg_min_days).toBeDefined();
      expect(metricResult.avg_max_days).toBeDefined();
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
      // Use factory to create test data
      const metric = flowMetricWithMappingFactory.buildManufacturing();
      const mockActiveMetrics = [metric];

      vi.mocked(getActiveFlowMetricsConfig).mockResolvedValue(mockActiveMetrics);
      vi.mocked(getDealsForCanonicalStage).mockRejectedValue(new Error('Deal calculation error'));

      const request = new NextRequest('http://localhost:3000/api/flow/metrics?period=7d');
      const response = await GET(request);
      const result = await response.json();

      expect(result.success).toBe(true); // API handles individual errors gracefully
      expect(result.data).toHaveLength(1);
      
      const metricResult = result.data[0];
      expect(metricResult.mainMetric).toBe('N/A');
      expect(metricResult.totalDeals).toBe(0);
    });

    it('should handle different time periods', async () => {
      // Use factory to create test data
      const metric = flowMetricWithMappingFactory.buildLeadConversion();
      const mockActiveMetrics = [metric];
      const mockDeals = canonicalStageDealFactory.buildMany(2);

      vi.mocked(getActiveFlowMetricsConfig).mockResolvedValue(mockActiveMetrics);
      vi.mocked(getDealsForCanonicalStage).mockResolvedValue(mockDeals);

      // Test different periods
      const periods = ['7d', '14d', '1m', '3m'];
      
      for (const period of periods) {
        const request = new NextRequest(`http://localhost:3000/api/flow/metrics?period=${period}`);
        const response = await GET(request);
        const result = await response.json();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
      }
    });
  });
});
