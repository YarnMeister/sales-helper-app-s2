/**
 * Flow Data Types
 * 
 * Types for raw Pipedrive deal flow data
 */

/**
 * Flow data row from database
 */
export interface FlowDataRow {
  id: string;
  dealId: number;
  pipelineId: number;
  stageId: number;
  stageName: string;
  timestamp: string;
  dealTitle?: string;
  dealValue?: number;
  dealCurrency?: string;
}

/**
 * Flow data table props
 */
export interface FlowDataTableData {
  data: FlowDataRow[];
  isLoading: boolean;
}
