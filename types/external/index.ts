/**
 * External Service Types Index
 * 
 * Central export point for all external service type definitions.
 * This includes types for third-party APIs and integrations.
 */

// Pipedrive CRM API types
export * from './pipedrive';

// Re-export commonly used external types for convenience
export type {
  PipedriveApiResponse,
  PipedrivePerson,
  PipedriveOrganization,
  PipedriveProduct,
  PipedriveDeal,
  PipedrivePipeline,
  PipedriveStage,
  PipedriveWebhookEvent,
  PipedriveApiError,
} from './pipedrive';
