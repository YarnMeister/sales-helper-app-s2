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
 * Note: This is a minimal implementation that provides the structure
 * for future feature-specific repositories
 */
export abstract class BaseRepository<T> implements BaseRepositoryInterface<T> {
  protected baseTableName: string;
  protected sql: any;

  constructor(baseTableName: string) {
    this.baseTableName = baseTableName;
    this.sql = getDatabaseConnection();
  }

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<T | null> {
    return withDbErrorHandling(async () => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        const result = await this.sql`SELECT * FROM mock_requests WHERE id = ${id} LIMIT 1`;
        return (result as any[])[0] || null;
      } else {
        const result = await this.sql`SELECT * FROM requests WHERE id = ${id} LIMIT 1`;
        return (result as any[])[0] || null;
      }
    }, `findById-${this.baseTableName}`);
  }

  /**
   * Find all records
   */
  async findAll(): Promise<T[]> {
    return withDbErrorHandling(async () => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        const result = await this.sql`SELECT * FROM mock_requests ORDER BY created_at DESC`;
        return result as T[];
      } else {
        const result = await this.sql`SELECT * FROM requests ORDER BY created_at DESC`;
        return result as T[];
      }
    }, `findAll-${this.baseTableName}`);
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<T> {
    return withDbErrorHandling(async () => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        const result = await this.sql`
          INSERT INTO mock_requests (request_id, status, created_at, updated_at)
          VALUES (${(data as any).request_id || null}, 'draft', ${new Date().toISOString()}, ${new Date().toISOString()})
          RETURNING *
        `;
        return (result as any[])[0];
      } else {
        const result = await this.sql`
          INSERT INTO requests (request_id, status, created_at, updated_at)
          VALUES (${(data as any).request_id || null}, 'draft', ${new Date().toISOString()}, ${new Date().toISOString()})
          RETURNING *
        `;
        return (result as any[])[0];
      }
    }, `create-${this.baseTableName}`);
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    return withDbErrorHandling(async () => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        const result = await this.sql`
          UPDATE mock_requests 
          SET updated_at = ${new Date().toISOString()}
          WHERE id = ${id}
          RETURNING *
        `;
        return (result as any[])[0] || null;
      } else {
        const result = await this.sql`
          UPDATE requests 
          SET updated_at = ${new Date().toISOString()}
          WHERE id = ${id}
          RETURNING *
        `;
        return (result as any[])[0] || null;
      }
    }, `update-${this.baseTableName}`);
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<boolean> {
    return withDbErrorHandling(async () => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        const result = await this.sql`DELETE FROM mock_requests WHERE id = ${id}`;
        return (result as any[]).length > 0;
      } else {
        const result = await this.sql`DELETE FROM requests WHERE id = ${id}`;
        return (result as any[]).length > 0;
      }
    }, `delete-${this.baseTableName}`);
  }

  /**
   * Count total records
   */
  async count(): Promise<number> {
    return withDbErrorHandling(async () => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        const result = await this.sql`SELECT COUNT(*) as count FROM mock_requests`;
        return parseInt((result as any[])[0].count);
      } else {
        const result = await this.sql`SELECT COUNT(*) as count FROM requests`;
        return parseInt((result as any[])[0].count);
      }
    }, `count-${this.baseTableName}`);
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
    }, `transaction-${this.baseTableName}`);
  }
}
