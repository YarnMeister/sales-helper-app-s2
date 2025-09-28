/**
 * Feature Types Index
 * 
 * Central export point for all feature-specific types.
 * This provides clean imports for feature modules.
 */

// Sales Requests feature types
export * from './sales-requests';

// Flow Metrics feature types
export * from './flow-metrics';

// Re-export commonly used types for convenience
export type {
  // Sales Requests
  Contact,
  Product,
  LineItem,
  Request,
  RequestFormData,
  ContactsHierarchy,
  ProductsHierarchy,
} from './sales-requests';

export type {
  // Flow Metrics
  FlowMetricsConfig,
  CanonicalStageMapping,
  FlowMetric,
  PipedriveDealFlowData,
  FlowMetricsDashboardData,
  KPICardData,
} from './flow-metrics';
