/**
 * Database System Startup
 * 
 * Initializes the repository system and registers all repositories.
 * This should be called during application startup.
 */

import { initializeRepositoryFactory, registerRepository } from './core/repository-factory';
import { SalesRequestsRepository } from './repositories/sales-requests-repository';
import { FlowMetricsRepository } from './repositories/flow-metrics-repository';
import { logInfo, logError } from '../log';

/**
 * Initialize the database repository system
 */
export function initializeDatabaseSystem() {
  try {
    logInfo('Initializing database repository system...');

    // Initialize the repository factory with configuration
    const factory = initializeRepositoryFactory({
      enableQueryLogging: process.env.NODE_ENV === 'development',
      enablePerformanceMonitoring: true,
      defaultPaginationLimit: 20,
      maxPaginationLimit: 100
    });

    // Register all repositories using the factory instance directly
    factory.registerRepository('salesRequests', new SalesRequestsRepository());
    factory.registerRepository('flowMetrics', new FlowMetricsRepository());

    logInfo('Database repository system initialized successfully', {
      registeredRepositories: factory.getRegisteredRepositories()
    });

    return factory;
  } catch (error) {
    logError('Failed to initialize database repository system', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Get repository statistics for monitoring
 */
export function getDatabaseSystemStats() {
  try {
    const { getRepositoryFactory } = require('./core/repository-factory');
    const factory = getRepositoryFactory();
    return factory.getStats();
  } catch (error) {
    logError('Failed to get database system stats', {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Health check for the database repository system
 */
export async function checkDatabaseSystemHealth() {
  try {
    const { getRepositoryFactory } = require('./core/repository-factory');
    const factory = getRepositoryFactory();
    
    // Basic health check - try to get a repository
    const salesRepo = factory.getRepository('salesRequests');
    
    // Test a simple operation (count)
    const result = await salesRepo.count();
    
    if (result.isError()) {
      throw new Error(`Repository health check failed: ${result.getError().message}`);
    }

    return {
      healthy: true,
      repositoryCount: factory.getRegisteredRepositories().length,
      testQuery: 'count',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logError('Database system health check failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}
