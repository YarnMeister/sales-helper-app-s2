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

      // Use the flow metrics API that calculates actual metrics from deals
      const response = await fetch(`/api/flow/metrics?period=${period}`);
      const result = await response.json();

      if (result.success) {
        // The API already returns data in the correct format
        setMetrics(result.data || []);
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
