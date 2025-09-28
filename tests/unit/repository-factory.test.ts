import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  RepositoryFactoryImpl,
  initializeRepositoryFactory,
  getRepositoryFactory,
  resetRepositoryFactory,
  getRepository,
  registerRepository
} from '../../lib/database/core/repository-factory';
import { BaseRepository, RepositoryConfig } from '../../lib/database/core/base-repository';
import { RepositoryResult } from '../../types/shared/repository';

// Mock repository for testing
class MockRepository implements BaseRepository<any> {
  async create(data: any): Promise<RepositoryResult<any>> {
    return { success: true, data: { id: 'mock-id', ...data } };
  }

  async findById(id: string | number): Promise<RepositoryResult<any | null>> {
    return { success: true, data: { id, name: 'Mock Entity' } };
  }

  async findAll(filters?: Record<string, any>): Promise<RepositoryResult<any[]>> {
    return { success: true, data: [{ id: '1', name: 'Entity 1' }] };
  }

  async findWithPagination(
    page: number,
    limit: number,
    filters?: Record<string, any>
  ): Promise<RepositoryResult<{ data: any[]; total: number; page: number; limit: number }>> {
    return {
      success: true,
      data: {
        data: [{ id: '1', name: 'Entity 1' }],
        total: 1,
        page,
        limit
      }
    };
  }

  async update(id: string | number, data: any): Promise<RepositoryResult<any | null>> {
    return { success: true, data: { id, ...data } };
  }

  async delete(id: string | number): Promise<RepositoryResult<boolean>> {
    return { success: true, data: true };
  }

  async exists(id: string | number): Promise<RepositoryResult<boolean>> {
    return { success: true, data: true };
  }

  async count(filters?: Record<string, any>): Promise<RepositoryResult<number>> {
    return { success: true, data: 1 };
  }
}

describe('RepositoryFactory', () => {
  let factory: RepositoryFactoryImpl;
  let mockRepository: MockRepository;

  beforeEach(() => {
    mockRepository = new MockRepository();
    factory = new RepositoryFactoryImpl();
  });

  afterEach(() => {
    resetRepositoryFactory();
  });

  describe('constructor', () => {
    it('should create factory with default config', () => {
      const newFactory = new RepositoryFactoryImpl();
      const config = newFactory.getConfig();

      expect(config.enableQueryLogging).toBe(false);
      expect(config.enablePerformanceMonitoring).toBe(false);
      expect(config.defaultPaginationLimit).toBe(20);
      expect(config.maxPaginationLimit).toBe(100);
    });

    it('should create factory with custom config', () => {
      const customConfig: RepositoryConfig = {
        enableQueryLogging: true,
        enablePerformanceMonitoring: true,
        defaultPaginationLimit: 50,
        maxPaginationLimit: 200
      };

      const newFactory = new RepositoryFactoryImpl(customConfig);
      const config = newFactory.getConfig();

      expect(config.enableQueryLogging).toBe(true);
      expect(config.enablePerformanceMonitoring).toBe(true);
      expect(config.defaultPaginationLimit).toBe(50);
      expect(config.maxPaginationLimit).toBe(200);
    });
  });

  describe('registerRepository', () => {
    it('should register a repository', () => {
      factory.registerRepository('test', mockRepository);

      expect(factory.hasRepository('test')).toBe(true);
      expect(factory.getRegisteredRepositories()).toContain('test');
    });

    it('should warn when overwriting existing repository', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      factory.registerRepository('test', mockRepository);
      factory.registerRepository('test', new MockRepository());

      expect(consoleSpy).toHaveBeenCalledWith(
        "Repository for entity 'test' is already registered. Overwriting..."
      );

      consoleSpy.mockRestore();
    });

    it('should log registration when query logging is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      factory.updateConfig({ enableQueryLogging: true });

      factory.registerRepository('test', mockRepository);

      expect(consoleSpy).toHaveBeenCalledWith('Repository registered for entity: test');

      consoleSpy.mockRestore();
    });
  });

  describe('getRepository', () => {
    it('should return registered repository', () => {
      factory.registerRepository('test', mockRepository);

      const repository = factory.getRepository('test');

      expect(repository).toBe(mockRepository);
    });

    it('should throw error for unregistered repository', () => {
      expect(() => factory.getRepository('nonexistent')).toThrow(
        "Repository for entity 'nonexistent' not found. Please register it first."
      );
    });
  });

  describe('hasRepository', () => {
    it('should return true for registered repository', () => {
      factory.registerRepository('test', mockRepository);

      expect(factory.hasRepository('test')).toBe(true);
    });

    it('should return false for unregistered repository', () => {
      expect(factory.hasRepository('nonexistent')).toBe(false);
    });
  });

  describe('unregisterRepository', () => {
    it('should unregister existing repository', () => {
      factory.registerRepository('test', mockRepository);
      
      const result = factory.unregisterRepository('test');

      expect(result).toBe(true);
      expect(factory.hasRepository('test')).toBe(false);
    });

    it('should return false for non-existing repository', () => {
      const result = factory.unregisterRepository('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getRegisteredRepositories', () => {
    it('should return empty array when no repositories registered', () => {
      const repositories = factory.getRegisteredRepositories();

      expect(repositories).toEqual([]);
    });

    it('should return list of registered repository names', () => {
      factory.registerRepository('test1', mockRepository);
      factory.registerRepository('test2', new MockRepository());

      const repositories = factory.getRegisteredRepositories();

      expect(repositories).toContain('test1');
      expect(repositories).toContain('test2');
      expect(repositories).toHaveLength(2);
    });
  });

  describe('clearRepositories', () => {
    it('should clear all repositories', () => {
      factory.registerRepository('test1', mockRepository);
      factory.registerRepository('test2', new MockRepository());

      factory.clearRepositories();

      expect(factory.getRegisteredRepositories()).toEqual([]);
      expect(factory.hasRepository('test1')).toBe(false);
      expect(factory.hasRepository('test2')).toBe(false);
    });

    it('should log when query logging is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      factory.updateConfig({ enableQueryLogging: true });

      factory.clearRepositories();

      expect(consoleSpy).toHaveBeenCalledWith('All repositories cleared');

      consoleSpy.mockRestore();
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = { enableQueryLogging: true, defaultPaginationLimit: 50 };

      factory.updateConfig(newConfig);

      const config = factory.getConfig();
      expect(config.enableQueryLogging).toBe(true);
      expect(config.defaultPaginationLimit).toBe(50);
      expect(config.enablePerformanceMonitoring).toBe(false); // Should keep existing values
    });

    it('should log config update when query logging is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      factory.updateConfig({ enableQueryLogging: true });

      factory.updateConfig({ defaultPaginationLimit: 50 });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Repository factory configuration updated:',
        expect.objectContaining({ enableQueryLogging: true, defaultPaginationLimit: 50 })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('validatePagination', () => {
    it('should validate and correct pagination parameters', () => {
      const result = factory.validatePagination(2, 25);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
    });

    it('should correct negative page to 1', () => {
      const result = factory.validatePagination(-1, 25);

      expect(result.page).toBe(1);
    });

    it('should correct zero page to 1', () => {
      const result = factory.validatePagination(0, 25);

      expect(result.page).toBe(1);
    });

    it('should correct negative limit to 1', () => {
      const result = factory.validatePagination(1, -5);

      expect(result.limit).toBe(1);
    });

    it('should limit maximum page size', () => {
      const result = factory.validatePagination(1, 200);

      expect(result.limit).toBe(100); // Default max limit
    });

    it('should respect custom max limit', () => {
      factory.updateConfig({ maxPaginationLimit: 50 });

      const result = factory.validatePagination(1, 100);

      expect(result.limit).toBe(50);
    });
  });

  describe('getStats', () => {
    it('should return factory statistics', () => {
      factory.registerRepository('test1', mockRepository);
      factory.registerRepository('test2', new MockRepository());

      const stats = factory.getStats();

      expect(stats.totalRepositories).toBe(2);
      expect(stats.registeredEntities).toEqual(['test1', 'test2']);
      expect(stats.config).toEqual(factory.getConfig());
    });
  });
});

describe('Global Repository Factory Functions', () => {
  afterEach(() => {
    resetRepositoryFactory();
  });

  describe('initializeRepositoryFactory', () => {
    it('should initialize global factory', () => {
      const factory = initializeRepositoryFactory();

      expect(factory).toBeInstanceOf(RepositoryFactoryImpl);
      expect(getRepositoryFactory()).toBe(factory);
    });

    it('should return existing factory if already initialized', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const factory1 = initializeRepositoryFactory();
      const factory2 = initializeRepositoryFactory();

      expect(factory1).toBe(factory2);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Global repository factory is already initialized. Returning existing instance.'
      );

      consoleSpy.mockRestore();
    });

    it('should log initialization when query logging is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const config = { enableQueryLogging: true };

      initializeRepositoryFactory(config);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Global repository factory initialized with config:',
        config
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getRepositoryFactory', () => {
    it('should return initialized factory', () => {
      const factory = initializeRepositoryFactory();

      expect(getRepositoryFactory()).toBe(factory);
    });

    it('should throw error if not initialized', () => {
      expect(() => getRepositoryFactory()).toThrow(
        'Global repository factory not initialized. Call initializeRepositoryFactory() first.'
      );
    });
  });

  describe('resetRepositoryFactory', () => {
    it('should reset global factory', () => {
      initializeRepositoryFactory();
      resetRepositoryFactory();

      expect(() => getRepositoryFactory()).toThrow(
        'Global repository factory not initialized. Call initializeRepositoryFactory() first.'
      );
    });
  });

  describe('convenience functions', () => {
    beforeEach(() => {
      initializeRepositoryFactory();
    });

    it('should register repository using convenience function', () => {
      const mockRepo = new MockRepository();

      registerRepository('test', mockRepo);

      expect(getRepositoryFactory().hasRepository('test')).toBe(true);
    });

    it('should get repository using convenience function', () => {
      const mockRepo = new MockRepository();
      registerRepository('test', mockRepo);

      const repository = getRepository('test');

      expect(repository).toBe(mockRepo);
    });
  });
});
