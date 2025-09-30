/**
 * useMetrics Hook
 * 
 * Fetches and manages flow metrics data for the dashboard
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FlowMetricData } from '../types';

interface UseMetricsReturn {
  metrics: FlowMetricData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMetrics(period: string): UseMetricsReturn {
  const [metrics, setMetrics] = useState<FlowMetricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/flow/metrics?period=${period}`);
      const result = await response.json();

      if (result.success) {
        // Convert API response to FlowMetricData format
        const formattedMetrics = result.data.map((metric: any) => ({
          id: metric.id,
          title: metric.title,
          mainMetric: `${metric.mainMetric} days`,
          totalDeals: metric.totalDeals,
          avg_min_days: metric.avg_min_days,
          avg_max_days: metric.avg_max_days,
          metric_comment: metric.metric_comment,
        }));

        setMetrics(formattedMetrics);
      } else {
        console.error('Failed to fetch metrics:', result.error);
        setError(result.error || 'Failed to fetch metrics');
        setMetrics([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching metrics:', err);
      setError(errorMessage);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics,
  };
}
