/**
 * Base Repository Interface
 * 
 * Provides common CRUD operations that all database repositories should implement.
 * This is the foundation for the modular architecture pattern.
 */

export interface BaseRepository<T, CreateDTO = Omit<T, 'id'>, UpdateDTO = Partial<T>> {
  /**
   * Create a new entity
   */
  create(data: CreateDTO): Promise<T>;

  /**
   * Find an entity by its ID
   */
  findById(id: string | number): Promise<T | null>;

  /**
   * Find all entities with optional filtering
   */
  findAll(filters?: Record<string, any>): Promise<T[]>;

  /**
   * Find entities with pagination
   */
  findWithPagination(
    page: number,
    limit: number,
    filters?: Record<string, any>
  ): Promise<{ data: T[]; total: number; page: number; limit: number }>;

  /**
   * Update an entity by ID
   */
  update(id: string | number, data: UpdateDTO): Promise<T | null>;

  /**
   * Delete an entity by ID
   */
  delete(id: string | number): Promise<boolean>;

  /**
   * Check if an entity exists
   */
  exists(id: string | number): Promise<boolean>;

  /**
   * Count entities with optional filtering
   */
  count(filters?: Record<string, any>): Promise<number>;
}

/**
 * Base Repository Implementation
 * 
 * Abstract class that provides default implementations for common operations.
 * Specific repositories can extend this and override methods as needed.
 */
export abstract class BaseRepositoryImpl<T, CreateDTO = Omit<T, 'id'>, UpdateDTO = Partial<T>>
  implements BaseRepository<T, CreateDTO, UpdateDTO>
{
  protected abstract tableName: string;
  protected abstract db: any; // Will be properly typed in concrete implementations

  /**
   * Create a new entity
   */
  async create(data: CreateDTO): Promise<T> {
    // Default implementation - should be overridden by concrete repositories
    throw new Error('create method must be implemented by concrete repository');
  }

  /**
   * Find an entity by its ID
   */
  async findById(id: string | number): Promise<T | null> {
    // Default implementation - should be overridden by concrete repositories
    throw new Error('findById method must be implemented by concrete repository');
  }

  /**
   * Find all entities with optional filtering
   */
  async findAll(filters?: Record<string, any>): Promise<T[]> {
    // Default implementation - should be overridden by concrete repositories
    throw new Error('findAll method must be implemented by concrete repository');
  }

  /**
   * Find entities with pagination
   */
  async findWithPagination(
    page: number,
    limit: number,
    filters?: Record<string, any>
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    // Default implementation - should be overridden by concrete repositories
    throw new Error('findWithPagination method must be implemented by concrete repository');
  }

  /**
   * Update an entity by ID
   */
  async update(id: string | number, data: UpdateDTO): Promise<T | null> {
    // Default implementation - should be overridden by concrete repositories
    throw new Error('update method must be implemented by concrete repository');
  }

  /**
   * Delete an entity by ID
   */
  async delete(id: string | number): Promise<boolean> {
    // Default implementation - should be overridden by concrete repositories
    throw new Error('delete method must be implemented by concrete repository');
  }

  /**
   * Check if an entity exists
   */
  async exists(id: string | number): Promise<boolean> {
    // Default implementation - should be overridden by concrete repositories
    throw new Error('exists method must be implemented by concrete repository');
  }

  /**
   * Count entities with optional filtering
   */
  async count(filters?: Record<string, any>): Promise<number> {
    // Default implementation - should be overridden by concrete repositories
    throw new Error('count method must be implemented by concrete repository');
  }

  /**
   * Helper method to build WHERE clauses from filters
   */
  protected buildWhereClause(filters: Record<string, any>): { sql: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          conditions.push(`${key} = ANY($${paramIndex})`);
          params.push(value);
        } else {
          conditions.push(`${key} = $${paramIndex}`);
          params.push(value);
        }
        paramIndex++;
      }
    }

    const sql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { sql, params };
  }

  /**
   * Helper method to build ORDER BY clause
   */
  protected buildOrderByClause(sortBy?: string, sortOrder: 'ASC' | 'DESC' = 'ASC'): string {
    if (!sortBy) return '';
    return `ORDER BY ${sortBy} ${sortOrder}`;
  }

  /**
   * Helper method to build LIMIT and OFFSET for pagination
   */
  protected buildPaginationClause(page: number, limit: number): { sql: string; params: any[] } {
    const offset = (page - 1) * limit;
    return {
      sql: `LIMIT $1 OFFSET $2`,
      params: [limit, offset]
    };
  }
}

/**
 * Repository Factory Interface
 * 
 * Defines how repositories should be created and managed.
 */
export interface RepositoryFactory {
  /**
   * Get a repository instance for a specific entity
   */
  getRepository<T>(entityName: string): BaseRepository<T>;

  /**
   * Check if a repository exists for the given entity
   */
  hasRepository(entityName: string): boolean;

  /**
   * Register a repository for an entity
   */
  registerRepository<T>(entityName: string, repository: BaseRepository<T>): void;
}

/**
 * Repository Configuration
 * 
 * Configuration options for repositories
 */
export interface RepositoryConfig {
  /**
   * Whether to enable query logging
   */
  enableQueryLogging?: boolean;

  /**
   * Whether to enable performance monitoring
   */
  enablePerformanceMonitoring?: boolean;

  /**
   * Default pagination limit
   */
  defaultPaginationLimit?: number;

  /**
   * Maximum pagination limit
   */
  maxPaginationLimit?: number;
}
