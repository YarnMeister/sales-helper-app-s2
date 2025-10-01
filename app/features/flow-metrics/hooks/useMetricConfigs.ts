/**
 * useMetricConfigs Hook
 * 
 * Fetches and manages metric configurations with CRUD operations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/use-toast';
import type { MetricConfigForm, MetricConfigJSON } from '../types';

interface MetricConfigData {
  id: string;
  metric_key: string;
  display_title: string;
  config: MetricConfigJSON;
  sort_order: number;
  is_active: boolean;
  start_stage_id?: number;
  end_stage_id?: number;
  avg_min_days?: number;
  avg_max_days?: number;
  metric_comment?: string;
  created_at: string;
  updated_at: string;
}

interface UseMetricConfigsReturn {
  configs: MetricConfigData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createConfig: (config: MetricConfigForm) => Promise<boolean>;
  updateConfig: (id: string, config: Partial<MetricConfigForm>) => Promise<boolean>;
  deleteConfig: (id: string) => Promise<boolean>;
}

export function useMetricConfigs(): UseMetricConfigsReturn {
  const [configs, setConfigs] = useState<MetricConfigData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/flow-metrics-config');
      const result = await response.json();

      if (result.success) {
        setConfigs(result.data || []);
      } else {
        console.error('Failed to fetch configs:', result.error);
        setError(result.error || 'Failed to fetch configurations');
        setConfigs([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching configs:', err);
      setError(errorMessage);
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createConfig = useCallback(
    async (config: MetricConfigForm): Promise<boolean> => {
      try {
        if (!config.startStage || !config.endStage) {
          toast({
            title: 'Validation Error',
            description: 'Both start and end stages are required',
            variant: 'destructive',
          });
          return false;
        }

        // Build JSONB config with full pipeline context
        const jsonbConfig: MetricConfigJSON = {
          startStage: {
            id: config.startStage.stageId,
            name: config.startStage.stageName,
            pipelineId: config.startStage.pipelineId,
            pipelineName: config.startStage.pipelineName,
          },
          endStage: {
            id: config.endStage.stageId,
            name: config.endStage.stageName,
            pipelineId: config.endStage.pipelineId,
            pipelineName: config.endStage.pipelineName,
          },
          thresholds: {
            minDays: config.avgMinDays,
            maxDays: config.avgMaxDays,
          },
          comment: config.metricComment,
        };

        // Use the new API endpoint
        const response = await fetch('/api/admin/flow-metrics-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metric_key: config.metricKey,
            display_title: config.displayTitle,
            config: jsonbConfig,
            sort_order: config.sortOrder,
            is_active: config.isActive,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast({
            title: 'Success',
            description: 'Metric configuration created successfully',
          });
          await fetchConfigs(); // Refresh list
          return true;
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to create configuration',
            variant: 'destructive',
          });
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }
    },
    [fetchConfigs, toast]
  );

  const updateConfig = useCallback(
    async (id: string, config: Partial<MetricConfigForm>): Promise<boolean> => {
      try {
        const response = await fetch(`/api/admin/flow-metrics-config/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            display_title: config.displayTitle,
            config: config.startStage && config.endStage ? {
              startStage: {
                id: config.startStage.stageId,
                name: config.startStage.stageName,
                pipelineId: config.startStage.pipelineId,
                pipelineName: config.startStage.pipelineName,
              },
              endStage: {
                id: config.endStage.stageId,
                name: config.endStage.stageName,
                pipelineId: config.endStage.pipelineId,
                pipelineName: config.endStage.pipelineName,
              },
              thresholds: {
                minDays: config.avgMinDays,
                maxDays: config.avgMaxDays,
              },
              comment: config.metricComment,
            } : undefined,
            sort_order: config.sortOrder,
            is_active: config.isActive,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast({
            title: 'Success',
            description: 'Metric configuration updated successfully',
          });
          await fetchConfigs(); // Refresh list
          return true;
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to update configuration',
            variant: 'destructive',
          });
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }
    },
    [fetchConfigs, toast]
  );

  const deleteConfig = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/admin/flow-metrics-config/${id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          toast({
            title: 'Success',
            description: 'Metric configuration deleted successfully',
          });
          await fetchConfigs(); // Refresh list
          return true;
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to delete configuration',
            variant: 'destructive',
          });
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }
    },
    [fetchConfigs, toast]
  );

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return {
    configs,
    loading,
    error,
    refresh: fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
  };
}
