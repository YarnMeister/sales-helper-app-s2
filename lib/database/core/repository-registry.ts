/**
 * Repository Registry
 * 
 * Registers all feature repositories with the repository factory.
 * This file maps entity names to their concrete repository implementations.
 */

import { initializeRepositoryFactory, getRepositoryFactory } from './repository-factory';
import { SalesRequestsRepository, PipedriveSubmissionsRepository } from '../features/sales-requests';
import { SiteVisitsRepository } from '../features/site-visits';
import { FlowMetricsRepository } from '../features/flow-metrics';
import { PipedriveDealFlowRepository, PipedriveMetricDataRepository } from '../features/pipedrive';

export type RepositoryName = 
  | 'salesRequests'
  | 'siteVisits'
  | 'pipedriveSubmissions'
  | 'flowMetricsConfig'
  | 'pipedriveDealFlow'
  | 'pipedriveMetricData';

export interface RepositoryMap {
  salesRequests: SalesRequestsRepository;
  siteVisits: SiteVisitsRepository;
  pipedriveSubmissions: PipedriveSubmissionsRepository;
  flowMetricsConfig: FlowMetricsRepository;
  pipedriveDealFlow: PipedriveDealFlowRepository;
  pipedriveMetricData: PipedriveMetricDataRepository;
}

let isInitialized = false;

export function registerAllRepositories(): void {
  if (isInitialized) {
    console.warn('Repositories already registered, skipping...');
    return;
  }

  const factory = initializeRepositoryFactory({
    enableQueryLogging: process.env.NODE_ENV === 'development',
    enablePerformanceMonitoring: process.env.NODE_ENV === 'development',
    defaultPaginationLimit: 20,
    maxPaginationLimit: 100
  });

  factory.registerRepository('salesRequests', new SalesRequestsRepository());
  factory.registerRepository('siteVisits', new SiteVisitsRepository());
  factory.registerRepository('pipedriveSubmissions', new PipedriveSubmissionsRepository());
  factory.registerRepository('flowMetricsConfig', new FlowMetricsRepository());
  factory.registerRepository('pipedriveDealFlow', new PipedriveDealFlowRepository());
  factory.registerRepository('pipedriveMetricData', new PipedriveMetricDataRepository());

  isInitialized = true;

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ All repositories registered:', factory.getRegisteredRepositories());
  }
}

export function getTypedRepository<K extends RepositoryName>(name: K): RepositoryMap[K] {
  if (!isInitialized) {
    registerAllRepositories();
  }
  
  return getRepositoryFactory().getRepository(name) as RepositoryMap[K];
}

export { getRepositoryFactory } from './repository-factory';
