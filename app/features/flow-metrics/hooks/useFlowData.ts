/**
 * useFlowData Hook
 * 
 * Fetches and manages raw Pipedrive flow data
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FlowDataRow } from '../types';

interface UseFlowDataReturn {
  data: FlowDataRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addData: (newData: FlowDataRow[]) => void;
}

export function useFlowData(): UseFlowDataReturn {
  const [data, setData] = useState<FlowDataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchFlowData();
  }, [fetchFlowData]);

  return {
    data,
    loading,
    error,
    refresh: fetchFlowData,
    addData,
  };
}
