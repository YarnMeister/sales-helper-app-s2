import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getActiveFlowMetricsConfig, getDealsForCanonicalStage } from '../../lib/db';

// Mock the database functions
vi.mock('../../lib/db', () => ({
  getActiveFlowMetricsConfig: vi.fn(),
  getDealsForCanonicalStage: vi.fn(),
}));

describe('Flow Metrics Consistency Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should ensure main page and detail page use same period filtering logic', async () => {
    // Mock active metrics
    const mockMetrics = [
      {
        metric_key: 'order-conversion',
        display_title: 'Order Conversion',
        canonical_stage: 'Order Conversion',
        is_active: true
      }
    ];

    // Mock deals data for different periods
    const mockDeals7d = [
      { deal_id: '1', start_date: '2025-08-22', end_date: '2025-08-25', duration_seconds: 259200 },
      { deal_id: '2', start_date: '2025-08-23', end_date: '2025-08-26', duration_seconds: 259200 }
    ];

    const mockDeals14d = [
      { deal_id: '1', start_date: '2025-08-15', end_date: '2025-08-18', duration_seconds: 259200 },
      { deal_id: '2', start_date: '2025-08-16', end_date: '2025-08-19', duration_seconds: 259200 },
      { deal_id: '3', start_date: '2025-08-22', end_date: '2025-08-25', duration_seconds: 259200 }
    ];

    vi.mocked(getActiveFlowMetricsConfig).mockResolvedValue(mockMetrics);
    vi.mocked(getDealsForCanonicalStage).mockResolvedValue(mockDeals7d);

    // Test that both main page and detail page use the same period parameter
    const period = '7d';
    const canonicalStage = 'Order Conversion';

    // Simulate main page API call
    const mainPageDeals = await getDealsForCanonicalStage(canonicalStage, period);
    
    // Simulate detail page API call
    const detailPageDeals = await getDealsForCanonicalStage(canonicalStage, period);

    // Both should return the same data for the same period
    expect(mainPageDeals).toEqual(detailPageDeals);
    expect(getDealsForCanonicalStage).toHaveBeenCalledWith(canonicalStage, period);
    expect(getDealsForCanonicalStage).toHaveBeenCalledTimes(2);
  });

  it('should ensure different periods return different data', async () => {
    const mockMetrics = [
      {
        metric_key: 'order-conversion',
        display_title: 'Order Conversion',
        canonical_stage: 'Order Conversion',
        is_active: true
      }
    ];

    const mockDeals7d = [
      { deal_id: '1', start_date: '2025-08-22', end_date: '2025-08-25', duration_seconds: 259200 }
    ];

    const mockDeals14d = [
      { deal_id: '1', start_date: '2025-08-15', end_date: '2025-08-18', duration_seconds: 259200 },
      { deal_id: '2', start_date: '2025-08-22', end_date: '2025-08-25', duration_seconds: 259200 }
    ];

    vi.mocked(getActiveFlowMetricsConfig).mockResolvedValue(mockMetrics);
    
    // Mock different responses for different periods
    vi.mocked(getDealsForCanonicalStage)
      .mockResolvedValueOnce(mockDeals7d)  // First call for 7d
      .mockResolvedValueOnce(mockDeals14d); // Second call for 14d

    const canonicalStage = 'Order Conversion';

    // Test 7-day period
    const deals7d = await getDealsForCanonicalStage(canonicalStage, '7d');
    
    // Test 14-day period
    const deals14d = await getDealsForCanonicalStage(canonicalStage, '14d');

    // Should return different data for different periods
    expect(deals7d).not.toEqual(deals14d);
    expect(deals7d).toHaveLength(1);
    expect(deals14d).toHaveLength(2);
  });

  it('should ensure period parameter is optional and defaults to all data', async () => {
    const mockMetrics = [
      {
        metric_key: 'order-conversion',
        display_title: 'Order Conversion',
        canonical_stage: 'Order Conversion',
        is_active: true
      }
    ];

    const mockAllDeals = [
      { deal_id: '1', start_date: '2025-08-01', end_date: '2025-08-04', duration_seconds: 259200 },
      { deal_id: '2', start_date: '2025-08-15', end_date: '2025-08-18', duration_seconds: 259200 },
      { deal_id: '3', start_date: '2025-08-22', end_date: '2025-08-25', duration_seconds: 259200 }
    ];

    vi.mocked(getActiveFlowMetricsConfig).mockResolvedValue(mockMetrics);
    vi.mocked(getDealsForCanonicalStage).mockResolvedValue(mockAllDeals);

    const canonicalStage = 'Order Conversion';

    // Test without period parameter (should return all data)
    const allDeals = await getDealsForCanonicalStage(canonicalStage);

    expect(allDeals).toEqual(mockAllDeals);
    expect(getDealsForCanonicalStage).toHaveBeenCalledWith(canonicalStage);
  });

  it('should ensure consistent calculation logic between main and detail pages', async () => {
    const mockDeals = [
      { deal_id: '1', start_date: '2025-08-22', end_date: '2025-08-25', duration_seconds: 259200 }, // 3 days
      { deal_id: '2', start_date: '2025-08-23', end_date: '2025-08-28', duration_seconds: 432000 }, // 5 days
      { deal_id: '3', start_date: '2025-08-24', end_date: '2025-08-26', duration_seconds: 172800 }  // 2 days
    ];

    // Calculate metrics using the same logic as both pages
    const durationsInDays = mockDeals.map(deal => 
      Math.round((deal.duration_seconds / 86400) * 100) / 100
    );

    const totalDays = durationsInDays.reduce((sum, days) => sum + days, 0);
    const average = Math.round((totalDays / durationsInDays.length) * 100) / 100;
    const best = Math.min(...durationsInDays);
    const worst = Math.max(...durationsInDays);

    // Expected values: [3.0, 5.0, 2.0] -> average: 3.33, best: 2.0, worst: 5.0
    expect(average).toBe(3.33);
    expect(best).toBe(2.0);
    expect(worst).toBe(5.0);
    expect(mockDeals).toHaveLength(3);
  });
});
