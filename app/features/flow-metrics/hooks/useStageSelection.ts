/**
 * useStageSelection Hook
 * 
 * Manages stage selection state and Pipedrive pipeline/stage data
 * Supports cross-pipeline metric selection
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface Pipeline {
  id: number;
  name: string;
  active: boolean;
}

interface Stage {
  id: number;
  name: string;
  pipeline_id: number;
  order_nr: number;
}

interface UseStageSelectionReturn {
  pipelines: Pipeline[];
  stages: Stage[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useStageSelection(): UseStageSelectionReturn {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPipelineData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pipelines
      const pipelinesResponse = await fetch('/api/pipedrive/pipelines');
      const pipelinesResult = await pipelinesResponse.json();

      if (!pipelinesResult.success) {
        throw new Error('Failed to fetch pipelines');
      }

      setPipelines(pipelinesResult.data || []);

      // Fetch stages for all pipelines
      const stagesResponse = await fetch('/api/pipedrive/stages');
      const stagesResult = await stagesResponse.json();

      if (!stagesResult.success) {
        throw new Error('Failed to fetch stages');
      }

      setStages(stagesResult.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching pipeline data:', err);
      setError(errorMessage);
      setPipelines([]);
      setStages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipelineData();
  }, [fetchPipelineData]);

  return {
    pipelines,
    stages,
    loading,
    error,
    refresh: fetchPipelineData,
  };
}
