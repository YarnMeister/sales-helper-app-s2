/**
 * Flow Metrics Runtime Data Types
 * 
 * Types for calculated metrics and metric display
 */

/**
 * Flow metric data for dashboard KPI cards
 */
export interface FlowMetricData {
  id: string;
  title: string;
  mainMetric: string;
  totalDeals: number;
  avg_min_days?: number;
  avg_max_days?: number;
  metric_comment?: string;
}

/**
 * Calculated metrics for a specific metric
 */
export interface CalculatedMetrics {
  average: number;
  best: number;
  worst: number;
  totalDeals: number;
}

/**
 * Deal data with duration information
 */
export interface DealData {
  deal_id: number;
  start_date: string;
  end_date: string;
  duration_seconds: number;
}

/**
 * Metric configuration from database
 */
export interface MetricConfig {
  id: string;
  metric_key: string;
  display_title: string;
  config: any;  // JSONB field - will be parsed as MetricConfigJSON
  start_stage_id?: number;
  end_stage_id?: number;
  avg_min_days?: number;
  avg_max_days?: number;
  metric_comment?: string;
}

/**
 * Metric status for color coding
 */
export type MetricStatus = 'good' | 'warning' | 'critical' | 'no-data';

/**
 * Time period selection
 */
export interface TimePeriod {
  value: string;
  label: string;
  days: number;
}
