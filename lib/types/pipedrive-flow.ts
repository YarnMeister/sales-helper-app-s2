// Pipedrive Flow Data Types
// These types define the structure of Pipedrive deal flow data

export interface PipedriveFlowEvent {
  id: number;
  deal_id: number;
  pipeline_id: number;
  stage_id: number;
  stage_name: string;
  entered_at: string; // ISO timestamp
  left_at?: string; // ISO timestamp, optional
  duration_seconds?: number;
}

export interface PipedriveDealMetadata {
  id: number;
  title: string;
  pipeline_id: number;
  stage_id: number;
  status: string;
}

export interface PipedriveFlowResponse {
  data: PipedriveFlowEvent[];
  success: boolean;
  error?: string;
}

// Database record types
export interface PipedriveDealFlowDataRecord {
  id: string;
  deal_id: number;
  pipeline_id: number;
  stage_id: number;
  stage_name: string;
  entered_at: string;
  left_at?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface PipedriveMetricDataRecord {
  id: number;
  title: string;
  pipeline_id: number;
  stage_id: number;
  status: string;
  first_fetched_at: string;
  last_fetched_at: string;
}

// API request/response types
export interface FetchDealFlowRequest {
  deal_id: number;
}

export interface FetchDealFlowResponse {
  success: boolean;
  data?: PipedriveDealFlowDataRecord[];
  error?: string;
  message?: string;
}
