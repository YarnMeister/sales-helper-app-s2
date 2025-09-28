import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseRepository, BaseRepositoryImpl, RepositoryConfig } from '../../lib/database/core/base-repository';
import { RepositoryResult, RepositoryError } from '../../types/shared/repository';

// Mock entity for testing
interface TestEntity {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

type TestCreateDTO = Omit<TestEntity, 'id' | 'created_at' | 'updated_at'>;
type TestUpdateDTO = Partial<TestCreateDTO>;

// Concrete implementation for testing
class TestRepository extends BaseRepositoryImpl<TestEntity, TestCreateDTO, TestUpdateDTO> {
  protected tableName = 'test_entities';
  protected db = vi.fn();

  async create(data: TestCreateDTO): Promise<RepositoryResult<TestEntity>> {
    const entity: TestEntity = {
      id: 'test-id',
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return {
      success: true,
      data: entity
    };
  }

  async findById(id: string): Promise<RepositoryResult<TestEntity | null>> {
    if (id === 'existing-id') {
      return {
        success: true,
        data: {
          id: 'existing-id',
          name: 'Test Entity',
          email: 'test@example.com',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      };
    }

    return {
      success: true,
      data: null
    };
  }

  async findAll(filters?: Record<string, any>): Promise<RepositoryResult<TestEntity[]>> {
    const entities: TestEntity[] = [
      {
        id: 'entity-1',
        name: 'Entity 1',
        email: 'entity1@example.com',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      {
        id: 'entity-2',
        name: 'Entity 2',
        email: 'entity2@example.com',
        created_at: '2023-01-02T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z'
      }
    ];

    // Apply filters if provided
    let filteredEntities = entities;
    if (filters?.name) {
      filteredEntities = entities.filter(e => e.name.includes(filters.name));
    }

    return {
      success: true,
      data: filteredEntities
    };
  }

  async findWithPagination(
    page: number,
    limit: number,
    filters?: Record<string, any>
  ): Promise<RepositoryResult<{ data: TestEntity[]; total: number; page: number; limit: number }>> {
    const allEntities = await this.findAll(filters);
    if (!allEntities.success || !allEntities.data) {
      return {
        success: false,
        error: 'Failed to fetch entities'
      };
    }

    const total = allEntities.data.length;
    const offset = (page - 1) * limit;
    const paginatedData = allEntities.data.slice(offset, offset + limit);

    return {
      success: true,
      data: {
        data: paginatedData,
        total,
        page,
        limit
      }
    };
  }

  async update(id: string, data: TestUpdateDTO): Promise<RepositoryResult<TestEntity | null>> {
    if (id === 'existing-id') {
      return {
        success: true,
        data: {
          id: 'existing-id',
          name: data.name || 'Test Entity',
          email: data.email || 'test@example.com',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: new Date().toISOString()
        }
      };
    }

    return {
      success: true,
      data: null
    };
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    return {
      success: true,
      data: id === 'existing-id'
    };
  }

  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return {
      success: true,
      data: id === 'existing-id'
    };
  }

  async count(filters?: Record<string, any>): Promise<RepositoryResult<number>> {
    const entities = await this.findAll(filters);
    if (!entities.success || !entities.data) {
      return {
        success: false,
        error: 'Failed to count entities'
      };
    }

    return {
      success: true,
      data: entities.data.length
    };
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;

  beforeEach(() => {
    repository = new TestRepository();
  });

  describe('create', () => {
    it('should create a new entity', async () => {
      const createData: TestCreateDTO = {
        name: 'New Entity',
        email: 'new@example.com'
      };

      const result = await repository.create(createData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('New Entity');
      expect(result.data?.email).toBe('new@example.com');
      expect(result.data?.id).toBeDefined();
      expect(result.data?.created_at).toBeDefined();
      expect(result.data?.updated_at).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find entity by existing ID', async () => {
      const result = await repository.findById('existing-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('existing-id');
      expect(result.data?.name).toBe('Test Entity');
    });

    it('should return null for non-existing ID', async () => {
      const result = await repository.findById('non-existing-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all entities without filters', async () => {
      const result = await repository.findAll();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].name).toBe('Entity 1');
      expect(result.data?.[1].name).toBe('Entity 2');
    });

    it('should find entities with filters', async () => {
      const result = await repository.findAll({ name: 'Entity 1' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe('Entity 1');
    });
  });

  describe('findWithPagination', () => {
    it('should return paginated results', async () => {
      const result = await repository.findWithPagination(1, 1);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.data).toHaveLength(1);
      expect(result.data?.total).toBe(2);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(1);
    });

    it('should return second page', async () => {
      const result = await repository.findWithPagination(2, 1);

      expect(result.success).toBe(true);
      expect(result.data?.data).toHaveLength(1);
      expect(result.data?.data[0].name).toBe('Entity 2');
    });

    it('should work with filters', async () => {
      const result = await repository.findWithPagination(1, 10, { name: 'Entity 1' });

      expect(result.success).toBe(true);
      expect(result.data?.data).toHaveLength(1);
      expect(result.data?.total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update existing entity', async () => {
      const updateData: TestUpdateDTO = {
        name: 'Updated Entity'
      };

      const result = await repository.update('existing-id', updateData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Updated Entity');
      expect(result.data?.updated_at).toBeDefined();
    });

    it('should return null for non-existing entity', async () => {
      const result = await repository.update('non-existing-id', { name: 'Updated' });

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing entity', async () => {
      const result = await repository.delete('existing-id');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for non-existing entity', async () => {
      const result = await repository.delete('non-existing-id');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing entity', async () => {
      const result = await repository.exists('existing-id');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for non-existing entity', async () => {
      const result = await repository.exists('non-existing-id');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all entities', async () => {
      const result = await repository.count();

      expect(result.success).toBe(true);
      expect(result.data).toBe(2);
    });

    it('should count entities with filters', async () => {
      const result = await repository.count({ name: 'Entity 1' });

      expect(result.success).toBe(true);
      expect(result.data).toBe(1);
    });
  });

  describe('helper methods', () => {
    it('should build WHERE clause correctly', () => {
      const filters = { name: 'John', age: 30, tags: ['admin', 'user'] };
      const result = (repository as any).buildWhereClause(filters);

      expect(result.sql).toBe('WHERE name = $1 AND age = $2 AND tags = ANY($3)');
      expect(result.params).toEqual(['John', 30, ['admin', 'user']]);
    });

    it('should build empty WHERE clause for no filters', () => {
      const result = (repository as any).buildWhereClause({});

      expect(result.sql).toBe('');
      expect(result.params).toEqual([]);
    });

    it('should build ORDER BY clause', () => {
      const result = (repository as any).buildOrderByClause('name', 'DESC');

      expect(result).toBe('ORDER BY name DESC');
    });

    it('should build pagination clause', () => {
      const result = (repository as any).buildPaginationClause(2, 10);

      expect(result.sql).toBe('LIMIT $1 OFFSET $2');
      expect(result.params).toEqual([10, 10]);
    });

    it('should create repository error', () => {
      const error = (repository as any).createError('Test error', 'validation_error', { detail: 'test' });

      expect(error.message).toBe('Test error');
      expect(error.type).toBe('validation_error');
      expect(error.details).toEqual({ detail: 'test' });
    });
  });
});
