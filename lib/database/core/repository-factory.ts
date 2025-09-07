/**
 * Repository Factory Implementation
 * 
 * Manages the creation and registration of repositories for different entities.
 * This is the central point for accessing repositories in the modular architecture.
 */

import { BaseRepository, RepositoryFactory, RepositoryConfig } from './base-repository';

export class RepositoryFactoryImpl implements RepositoryFactory {
  private repositories = new Map<string, BaseRepository<any>>();
  private config: RepositoryConfig;

  constructor(config: RepositoryConfig = {}) {
    this.config = {
      enableQueryLogging: false,
      enablePerformanceMonitoring: false,
      defaultPaginationLimit: 20,
      maxPaginationLimit: 100,
      ...config
    };
  }

  /**
   * Get a repository instance for a specific entity
   */
  getRepository<T>(entityName: string): BaseRepository<T> {
    const repository = this.repositories.get(entityName);
    if (!repository) {
      throw new Error(`Repository for entity '${entityName}' not found. Please register it first.`);
    }
    return repository as BaseRepository<T>;
  }

  /**
   * Check if a repository exists for the given entity
   */
  hasRepository(entityName: string): boolean {
    return this.repositories.has(entityName);
  }

  /**
   * Register a repository for an entity
   */
  registerRepository<T>(entityName: string, repository: BaseRepository<T>): void {
    if (this.repositories.has(entityName)) {
      console.warn(`Repository for entity '${entityName}' is already registered. Overwriting...`);
    }
    
    this.repositories.set(entityName, repository);
    
    if (this.config.enableQueryLogging) {
      console.log(`Repository registered for entity: ${entityName}`);
    }
  }

  /**
   * Unregister a repository for an entity
   */
  unregisterRepository(entityName: string): boolean {
    return this.repositories.delete(entityName);
  }

  /**
   * Get all registered repository names
   */
  getRegisteredRepositories(): string[] {
    return Array.from(this.repositories.keys());
  }

  /**
   * Clear all registered repositories
   */
  clearRepositories(): void {
    this.repositories.clear();
    
    if (this.config.enableQueryLogging) {
      console.log('All repositories cleared');
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): RepositoryConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   */
  updateConfig(newConfig: Partial<RepositoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enableQueryLogging) {
      console.log('Repository factory configuration updated:', this.config);
    }
  }

  /**
   * Validate pagination parameters
   */
  validatePagination(page: number, limit: number): { page: number; limit: number } {
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(
      Math.max(1, limit),
      this.config.maxPaginationLimit || 100
    );
    
    return { page: validatedPage, limit: validatedLimit };
  }

  /**
   * Get repository statistics
   */
  getStats(): {
    totalRepositories: number;
    registeredEntities: string[];
    config: RepositoryConfig;
  } {
    return {
      totalRepositories: this.repositories.size,
      registeredEntities: this.getRegisteredRepositories(),
      config: this.getConfig()
    };
  }
}

/**
 * Global repository factory instance
 * 
 * This is the main entry point for accessing repositories throughout the application.
 * It should be initialized during application startup.
 */
let globalRepositoryFactory: RepositoryFactoryImpl | null = null;

/**
 * Initialize the global repository factory
 */
export function initializeRepositoryFactory(config?: RepositoryConfig): RepositoryFactoryImpl {
  if (globalRepositoryFactory) {
    console.warn('Global repository factory is already initialized. Returning existing instance.');
    return globalRepositoryFactory;
  }

  globalRepositoryFactory = new RepositoryFactoryImpl(config);
  
  if (config?.enableQueryLogging) {
    console.log('Global repository factory initialized with config:', config);
  }
  
  return globalRepositoryFactory;
}

/**
 * Get the global repository factory instance
 */
export function getRepositoryFactory(): RepositoryFactoryImpl {
  if (!globalRepositoryFactory) {
    throw new Error(
      'Global repository factory not initialized. Call initializeRepositoryFactory() first.'
    );
  }
  return globalRepositoryFactory;
}

/**
 * Reset the global repository factory (mainly for testing)
 */
export function resetRepositoryFactory(): void {
  globalRepositoryFactory = null;
}

/**
 * Convenience function to get a repository directly
 */
export function getRepository<T>(entityName: string): BaseRepository<T> {
  return getRepositoryFactory().getRepository<T>(entityName);
}

/**
 * Convenience function to register a repository
 */
export function registerRepository<T>(entityName: string, repository: BaseRepository<T>): void {
  getRepositoryFactory().registerRepository(entityName, repository);
}
