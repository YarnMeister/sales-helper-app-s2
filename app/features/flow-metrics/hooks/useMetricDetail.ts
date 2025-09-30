/**
 * useMetricDetail Hook
 * 
 * Fetches detailed data for a specific metric including deals and configuration
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DealData, MetricConfig } from '../types';

interface UseMetricDetailReturn {
  deals: DealData[];
  config: MetricConfig | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMetricDetail(
  metricId: string,
  period: string
): UseMetricDetailReturn {
  const [deals, setDeals] = useState<DealData[]>([]);
  const [config, setConfig] = useState<MetricConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch metric configuration
      const configResponse = await fetch(`/api/flow/canonical-stage-deals?metricId=${metricId}`);
      const configResult = await configResponse.json();

      if (!configResult.success) {
        throw new Error(configResult.error || 'Failed to fetch metric configuration');
      }

      setConfig(configResult.metricConfig);

      // Fetch deals for this metric
      const dealsResponse = await fetch(
        `/api/flow/canonical-stage-deals?metricId=${metricId}&period=${period}`
      );
      const dealsResult = await dealsResponse.json();

      if (dealsResult.success) {
        setDeals(dealsResult.data || []);
      } else {
        throw new Error(dealsResult.error || 'Failed to fetch deals');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching metric detail:', err);
      setError(errorMessage);
      setDeals([]);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, [metricId, period]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    deals,
    config,
    loading,
    error,
    refresh: fetchDetail,
  };
}
