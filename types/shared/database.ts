/**
 * Shared Database Types
 * 
 * Core database types that are shared across all feature modules.
 * These types ensure consistency in database operations and schema definitions.
 */

import { z } from 'zod';

// Import BaseEntity from repository types to avoid duplication
import type { BaseEntity } from './repository';

/**
 * Request status enumeration
 */
export type RequestStatus = 'draft' | 'submitted' | 'failed';

/**
 * Salesperson selection enumeration
 */
export type SalespersonSelection = 'Luyanda' | 'James' | 'Stefan';

/**
 * Contact JSONB structure for database storage
 */
export interface ContactJSON {
  personId: number;
  orgId?: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  mineGroup: string;  // Required for mobile-first workflow
  mineName: string;   // Required for mobile-first workflow
  company?: string;
  title?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  customFields?: Record<string, any>;
}

/**
 * Line Item JSONB structure for database storage
 */
export interface LineItemJSON {
  pipedriveProductId: number;
  name: string;
  code?: string | null;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency?: string;
  category?: string;
  customFields?: Record<string, any>;
  shortDescription?: string;
  showOnSalesHelper?: boolean;
}

/**
 * Main Request database entity
 */
export interface RequestEntity extends BaseEntity {
  requestId: string;  // QR-001 format
  status: RequestStatus;
  salespersonFirstName?: string;
  salespersonSelection?: SalespersonSelection;
  mineGroup?: string;
  mineName?: string;
  contact: ContactJSON | null;
  lineItems: LineItemJSON[];
  comment?: string;
  pipedriveDealId?: number;
  
  // Generated columns for fast filtering
  contactPersonIdInt?: number;
  contactOrgIdInt?: number;
  contactMineGroup?: string;
  contactMineName?: string;
}

/**
 * Flow Metrics Config database entity
 */
export interface FlowMetricsConfigEntity extends BaseEntity {
  metricKey: string;
  displayTitle: string;
  canonicalStage: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Canonical Stage Mapping database entity
 */
export interface CanonicalStageMappingEntity extends BaseEntity {
  metricConfigId: string;
  startStageId: number;
  endStageId: number;
  avgMinDays?: number;
  avgMaxDays?: number;
  metricComment?: string;
}

/**
 * Site Visit database entity
 */
export interface SiteVisitEntity extends BaseEntity {
  date: Date;
  salesperson: string;
  plannedMines: string[];
  mainPurpose: string;
  availability: string;
  comments?: string;
}

/**
 * Pipedrive Deal Flow Data database entity
 */
export interface PipedriveDealFlowDataEntity extends BaseEntity {
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
  addTime: Date;
  updateTime: Date;
  stageChangeTime?: Date;
  wonTime?: Date;
  lostTime?: Date;
  closeTime?: Date;
  status: string;
  pipedriveEventId?: string;
}

/**
 * KV Cache database entity
 */
export interface KVCacheEntity {
  id: string;
  key: string;
  value: any;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mock Pipedrive Submission database entity
 */
export interface MockPipedriveSubmissionEntity extends BaseEntity {
  requestId: string;
  payload: any;
  simulatedDealId: number;
  status: string;
}

/**
 * Database table names constants
 */
export const DATABASE_TABLES = {
  REQUESTS: 'requests',
  FLOW_METRICS_CONFIG: 'flow_metrics_config',
  CANONICAL_STAGE_MAPPINGS: 'canonical_stage_mappings',
  SITE_VISITS: 'site_visits',
  PIPEDRIVE_DEAL_FLOW_DATA: 'pipedrive_deal_flow_data',
  KV_CACHE: 'kv_cache',
  MOCK_PIPEDRIVE_SUBMISSIONS: 'pipedrive_submissions',
  SCHEMA_MIGRATIONS: 'schema_migrations',
} as const;

/**
 * Database operation types
 */
export type DatabaseOperation = 'create' | 'read' | 'update' | 'delete' | 'list';

/**
 * Database filter operators
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike';

/**
 * Database sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Generic database filter interface
 */
export interface DatabaseFilter<T = any> {
  field: keyof T;
  operator: FilterOperator;
  value: any;
}

/**
 * Generic database sort interface
 */
export interface DatabaseSort<T = any> {
  field: keyof T;
  direction: SortDirection;
}

/**
 * Database query options
 */
export interface DatabaseQueryOptions<T = any> {
  filters?: DatabaseFilter<T>[];
  sort?: DatabaseSort<T>[];
  limit?: number;
  offset?: number;
  include?: string[];
  select?: (keyof T)[];
}

/**
 * Database pagination options
 */
export interface DatabasePaginationOptions {
  page: number;
  limit: number;
}

/**
 * Database pagination result
 */
export interface DatabasePaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Database transaction interface
 */
export interface DatabaseTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

/**
 * Database connection health status
 */
export interface DatabaseHealth {
  healthy: boolean;
  latency: number;
  environment: string;
  version: string;
  timestamp: Date;
}
