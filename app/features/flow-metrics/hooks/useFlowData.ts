/**
 * useFlowData Hook
 *
 * Fetches and manages raw Pipedrive flow data
 * Supports auto-refresh during sync operations
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FlowDataRow } from '../types';

interface UseFlowDataReturn {
  data: FlowDataRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addData: (newData: FlowDataRow[]) => void;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
}

export function useFlowData(): UseFlowDataReturn {
  const [data, setData] = useState<FlowDataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchFlowData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/pipedrive/deal-flow-data');
      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
      } else {
        console.error('Failed to fetch flow data:', result.error);
        setError(result.error || 'Failed to fetch flow data');
        setData([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching flow data:', err);
      setError(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addData = useCallback((newData: FlowDataRow[]) => {
    setData((prevData) => {
      // Avoid duplicates by checking IDs
      const existingIds = new Set(prevData.map((item) => item.id));
      const uniqueNewData = newData.filter((item) => !existingIds.has(item.id));
      return [...uniqueNewData, ...prevData];
    });
  }, []);

  const startAutoRefresh = useCallback(() => {
    // Clear any existing interval
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }

    // Refresh every 5 seconds during sync
    autoRefreshInterval.current = setInterval(() => {
      fetchFlowData();
    }, 5000);
  }, [fetchFlowData]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchFlowData();
  }, [fetchFlowData]);

  return {
    data,
    loading,
    error,
    refresh: fetchFlowData,
    addData,
    startAutoRefresh,
    stopAutoRefresh,
  };
}
