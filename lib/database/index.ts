// Core database exports
export * from './connection';
export * from './migrations';
export * from './schema';

// Repository exports - using re-export pattern
export { FlowMetricsRepository } from './repositories/flow-metrics-repository';
// Removed: CanonicalStageMappingsRepository (canonical_stage_mappings table dropped)
export { SalesRequestsRepository } from './repositories/sales-requests-repository';
export { SiteVisitsRepository } from './repositories/sales-requests-repository';
export { PipedriveSubmissionsRepository } from './repositories/sales-requests-repository';
// MockRequestsRepository removed - mock_requests table doesn't exist in production

// Core infrastructure exports
export * from './core/base-repository';
export * from './core/repository-factory';
export * from './core/types';

// Shared types - only export what's not already exported from core
export * from '../../types/shared/common';
export * from '../../types/shared/environment';
