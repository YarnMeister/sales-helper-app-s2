/**
 * Flow Metrics Feature Types
 * 
 * Type definitions specific to the flow metrics feature module.
 * These types handle flow efficiency reporting, stage mappings, and analytics.
 */

import { z } from 'zod';
import type { PipedrivePipeline, PipedriveStage } from '../external/pipedrive';

/**
 * Flow Metrics Configuration interface
 */
export interface FlowMetricsConfig {
  id: string;
  metricKey: string;
  displayTitle: string;
  canonicalStage: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Canonical Stage Mapping interface
 */
export interface CanonicalStageMapping {
  id: string;
  metricConfigId: string;
  startStageId: number;
  endStageId: number;
  avgMinDays?: number;
  avgMaxDays?: number;
  metricComment?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Flow Metric Data interface
 */
export interface FlowMetric {
  id: string;
  metricKey: string;
  displayTitle: string;
  canonicalStage: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  threshold?: {
    min?: number;
    max?: number;
    target?: number;
  };
  period: string;
  calculatedAt: string;
}

/**
 * Pipedrive Deal Flow Data interface
 */
export interface PipedriveDealFlowData {
  id: string;
  dealId: number;
  pipelineId: number;
  stageId: number;
  stageName: string;
  stageOrderNr: number;
  dealTitle: string;
  dealValue: number;
  dealCurrency: string;
  personId?: number;
  personName?: string;
  orgId?: number;
  orgName?: string;
  addTime: string;
  updateTime: string;
  stageChangeTime?: string;
  wonTime?: string;
  lostTime?: string;
  closeTime?: string;
  status: string;
  pipedriveEventId?: string;
  createdAt: string;
  updatedAt: string;
}





/**
 * Flow Metrics Dashboard Data interface
 */
export interface FlowMetricsDashboardData {
  metrics: FlowMetric[];
  period: string;
  lastUpdated: string;
  summary: {
    totalDeals: number;
    averageFlowTime: number;
    bottlenecks: string[];
    improvements: string[];
  };
}

/**
 * KPI Card Data interface
 */
export interface KPICardData {
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  trendLabel?: string;
  status?: 'good' | 'warning' | 'critical';
  description?: string;
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
}

/**
 * Flow Data Table Row interface
 */
export interface FlowDataTableRow {
  dealId: number;
  dealTitle: string;
  stageName: string;
  stageOrderNr: number;
  dealValue: number;
  dealCurrency: string;
  personName?: string;
  orgName?: string;
  daysInStage: number;
  totalFlowTime: number;
  status: string;
  lastUpdated: string;
}

/**
 * Stage Mapping Form Data interface
 */
export interface StageMappingFormData {
  metricConfigId: string;
  startStageId: number;
  endStageId: number;
  avgMinDays?: number;
  avgMaxDays?: number;
  metricComment?: string;
}

/**
 * Metrics Configuration Form Data interface
 */
export interface MetricsConfigFormData {
  metricKey: string;
  displayTitle: string;
  canonicalStage: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Flow Metrics Filters interface
 */
export interface FlowMetricsFilters {
  period?: '7d' | '30d' | '90d' | '1y';
  pipelineId?: number;
  stageIds?: number[];
  dealValueMin?: number;
  dealValueMax?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: string[];
}

/**
 * API Response types
 */
export interface FlowMetricsApiResponse {
  success: boolean;
  data: FlowMetric[];
  message?: string;
  period?: string;
}

export interface FlowMetricsConfigApiResponse {
  success: boolean;
  data: FlowMetricsConfig[];
  message?: string;
}

export interface PipedriveStagesApiResponse {
  success: boolean;
  data: PipedriveStage[];
  message?: string;
}

export interface PipedrivePipelinesApiResponse {
  success: boolean;
  data: PipedrivePipeline[];
  message?: string;
}

export interface FlowDataApiResponse {
  success: boolean;
  data: FlowDataTableRow[];
  total: number;
  page: number;
  limit: number;
  message?: string;
}

/**
 * Component Props types
 */
export interface MetricsDashboardProps {
  metrics: FlowMetric[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  period?: string;
  onPeriodChange?: (period: string) => void;
}

export interface KPICardProps {
  data: KPICardData;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface MetricsManagementProps {
  configs: FlowMetricsConfig[];
  mappings: CanonicalStageMapping[];
  onConfigCreate?: (config: MetricsConfigFormData) => Promise<void>;
  onConfigUpdate?: (id: string, config: Partial<MetricsConfigFormData>) => Promise<void>;
  onConfigDelete?: (id: string) => Promise<void>;
  onMappingCreate?: (mapping: StageMappingFormData) => Promise<void>;
  onMappingUpdate?: (id: string, mapping: Partial<StageMappingFormData>) => Promise<void>;
  onMappingDelete?: (id: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface PipedriveStageExplorerProps {
  pipelines: PipedrivePipeline[];
  stages: PipedriveStage[];
  selectedPipelineId?: number;
  onPipelineSelect?: (pipelineId: number) => void;
  loading?: boolean;
  error?: string;
}

export interface FlowDataTableProps {
  data: FlowDataTableRow[];
  loading?: boolean;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  filters?: FlowMetricsFilters;
  onFiltersChange?: (filters: FlowMetricsFilters) => void;
  onRowClick?: (row: FlowDataTableRow) => void;
}

/**
 * Hook return types
 */
export interface UseFlowMetricsReturn {
  metrics: FlowMetric[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  period: string;
  setPeriod: (period: string) => void;
}

export interface UseFlowDataReturn {
  data: FlowDataTableRow[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: FlowMetricsFilters;
  setFilters: (filters: FlowMetricsFilters) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refresh: () => Promise<void>;
}

export interface UseStageMappingsReturn {
  mappings: CanonicalStageMapping[];
  loading: boolean;
  error: string | null;
  createMapping: (mapping: StageMappingFormData) => Promise<void>;
  updateMapping: (id: string, mapping: Partial<StageMappingFormData>) => Promise<void>;
  deleteMapping: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Validation schemas
 */
export const FlowMetricsConfigSchema = z.object({
  metricKey: z.string().min(1),
  displayTitle: z.string().min(1),
  canonicalStage: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

export const StageMappingSchema = z.object({
  metricConfigId: z.string().uuid(),
  startStageId: z.number().int().positive(),
  endStageId: z.number().int().positive(),
  avgMinDays: z.number().nonnegative().optional(),
  avgMaxDays: z.number().nonnegative().optional(),
  metricComment: z.string().optional(),
});

export const FlowMetricsFiltersSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).optional(),
  pipelineId: z.number().int().positive().optional(),
  stageIds: z.array(z.number().int().positive()).optional(),
  dealValueMin: z.number().nonnegative().optional(),
  dealValueMax: z.number().nonnegative().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: z.array(z.string()).optional(),
});

/**
 * Constants
 */
export const FLOW_METRICS_PERIODS = ['7d', '30d', '90d', '1y'] as const;
export const FLOW_METRICS_PERIOD_LABELS: Record<string, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '1y': 'Last year',
};

export const KPI_STATUS_COLORS: Record<string, string> = {
  good: 'text-green-600',
  warning: 'text-yellow-600',
  critical: 'text-red-600',
};

export const TREND_ICONS: Record<string, string> = {
  up: '↗️',
  down: '↘️',
  stable: '→',
};

/**
 * Utility types
 */
export type FlowMetricsConfigCreateData = Omit<FlowMetricsConfig, 'id' | 'createdAt' | 'updatedAt'>;
export type FlowMetricsConfigUpdateData = Partial<FlowMetricsConfigCreateData>;
export type StageMappingCreateData = Omit<CanonicalStageMapping, 'id' | 'createdAt' | 'updatedAt'>;
export type StageMappingUpdateData = Partial<StageMappingCreateData>;
