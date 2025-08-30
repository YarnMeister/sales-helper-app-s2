export { ContactFactory } from './contact-factory';
export { LineItemFactory } from './line-item-factory';
export { RequestFactory } from './request-factory';
export { DBRequestFactory } from './db-request-factory';
export type { TestRequestDB } from './db-request-factory';
export type { TContactJSON } from './contact-factory';
export type { TLineItem } from './line-item-factory';
export type { TRequestUpsert } from './request-factory';

// Flow Metrics Factories
export { 
  FlowMetricConfigFactory,
  CanonicalStageMappingFactory,
  PipedriveDealFlowDataFactory,
  CanonicalStageDealFactory,
  FlowMetricWithMappingFactory,
  TEST_DATA_SETS,
  PREDEFINED_METRICS,
  STAGE_NAMES
} from './flow-metrics-factory';
export type {
  TFlowMetricConfig,
  TCanonicalStageMapping,
  TPipedriveDealFlowData,
  TFlowMetricWithMapping,
  TCanonicalStageDeal
} from './flow-metrics-factory';

// Import the classes first
import { ContactFactory } from './contact-factory';
import { LineItemFactory } from './line-item-factory';
import { RequestFactory } from './request-factory';
import { DBRequestFactory } from './db-request-factory';
import {
  FlowMetricConfigFactory,
  CanonicalStageMappingFactory,
  PipedriveDealFlowDataFactory,
  CanonicalStageDealFactory,
  FlowMetricWithMappingFactory,
  flowMetricConfigFactory,
  canonicalStageMappingFactory,
  pipedriveDealFlowDataFactory,
  canonicalStageDealFactory,
  flowMetricWithMappingFactory
} from './flow-metrics-factory';

// Convenience instances
export const contactFactory = new ContactFactory();
export const lineItemFactory = new LineItemFactory();
export const requestFactory = new RequestFactory();
export const dbRequestFactory = new DBRequestFactory();

// Flow Metrics convenience instances
export { 
  flowMetricConfigFactory,
  canonicalStageMappingFactory,
  pipedriveDealFlowDataFactory,
  canonicalStageDealFactory,
  flowMetricWithMappingFactory
};
