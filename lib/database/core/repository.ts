import { getDatabaseConnection, withDbErrorHandling } from './connection';

/**
 * Base repository interface for common CRUD operations
 */
export interface BaseRepositoryInterface<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}

/**
 * Base repository implementation with common CRUD operations
 * Simplified version that uses single table names (no more mock_ prefix)
 */
export abstract class BaseRepository<T> implements BaseRepositoryInterface<T> {
  protected tableName: string;
  protected sql: any;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.sql = getDatabaseConnection();
  }

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<T | null> {
    return withDbErrorHandling(async () => {
      const result = await this.sql`SELECT * FROM ${this.sql(this.tableName)} WHERE id = ${id} LIMIT 1`;
      return (result as any[])[0] || null;
    }, `findById-${this.tableName}`);
  }

  /**
   * Find all records
   */
  async findAll(): Promise<T[]> {
    return withDbErrorHandling(async () => {
      const result = await this.sql`SELECT * FROM ${this.sql(this.tableName)} ORDER BY created_at DESC`;
      return result as T[];
    }, `findAll-${this.tableName}`);
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<T> {
    return withDbErrorHandling(async () => {
      const result = await this.sql`
        INSERT INTO ${this.sql(this.tableName)} (${this.sql(Object.keys(data))})
        VALUES (${this.sql(Object.values(data))})
        RETURNING *
      `;
      return (result as any[])[0];
    }, `create-${this.tableName}`);
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    return withDbErrorHandling(async () => {
      const result = await this.sql`
        UPDATE ${this.sql(this.tableName)}
        SET ${this.sql(Object.entries(data).map(([key, value]) => `${key} = ${value}`).join(', '))}
        WHERE id = ${id}
        RETURNING *
      `;
      return (result as any[])[0] || null;
    }, `update-${this.tableName}`);
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<boolean> {
    return withDbErrorHandling(async () => {
      const result = await this.sql`DELETE FROM ${this.sql(this.tableName)} WHERE id = ${id}`;
      return (result as any[]).length > 0;
    }, `delete-${this.tableName}`);
  }

  /**
   * Count total records
   */
  async count(): Promise<number> {
    return withDbErrorHandling(async () => {
      const result = await this.sql`SELECT COUNT(*) as count FROM ${this.sql(this.tableName)}`;
      return parseInt((result as any[])[0].count);
    }, `count-${this.tableName}`);
  }

  /**
   * Execute a transaction
   */
  async transaction<TResult>(
    operation: (sql: any) => Promise<TResult>
  ): Promise<TResult> {
    return withDbErrorHandling(async () => {
      // Note: Neon serverless doesn't support explicit transactions
      // This is a placeholder for future transaction support
      return await operation(this.sql);
    }, `transaction-${this.tableName}`);
  }
}
