/**
 * Flow Metrics Configuration Types
 * 
 * These types support cross-pipeline metrics (e.g., "Order to Cash")
 * where start and end stages can be in different pipelines.
 */

/**
 * JSONB structure for metric configuration stored in database
 * 
 * IMPORTANT: Supports cross-pipeline metrics!
 * - startStage and endStage each have their own pipeline context
 * - pipelineId can differ between start and end stages
 * 
 * Example: "Order to Cash"
 *   startStage: { pipelineId: 5, id: 501, name: "New Orders", pipelineName: "New Orders - All" }
 *   endStage: { pipelineId: 8, id: 801, name: "Invoice Paid", pipelineName: "Finance" }
 */
export interface MetricConfigJSON {
  startStage: {
    id: number;
    name: string;
    pipelineId: number;
    pipelineName: string;
  };
  endStage: {
    id: number;
    name: string;
    pipelineId: number;      // Can be different from startStage.pipelineId!
    pipelineName: string;
  };
  thresholds: {
    minDays?: number;
    maxDays?: number;
  };
  comment?: string;
}

/**
 * Stage selection for UI
 * Includes full pipeline context to support cross-pipeline metrics
 */
export interface StageSelection {
  stageId: number;
  stageName: string;
  pipelineId: number;
  pipelineName: string;
}

/**
 * Form data for creating/editing metrics
 * Allows selection of stages from any pipelines (same or different)
 */
export interface MetricConfigForm {
  metricKey: string;
  displayTitle: string;
  startStage: StageSelection | null;
  endStage: StageSelection | null;
  avgMinDays?: number;
  avgMaxDays?: number;
  metricComment?: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
