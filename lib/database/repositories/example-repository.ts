/**
 * Example Repository Implementation
 * 
 * Demonstrates how to implement a concrete repository using the base repository pattern.
 * This serves as a template for other repositories in the modular architecture.
 */

import { BaseRepositoryImpl } from '../core/base-repository';
import { BaseEntity, PaginationResult, QueryOptions } from '../../types/shared/repository';
import { getDatabaseConnection } from '../database';

/**
 * Example entity interface
 */
export interface ExampleEntity extends BaseEntity {
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  metadata?: Record<string, any>;
}

/**
 * Create DTO for example entity
 */
export interface CreateExampleDTO {
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  metadata?: Record<string, any>;
}

/**
 * Update DTO for example entity
 */
export interface UpdateExampleDTO {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
  metadata?: Record<string, any>;
}

/**
 * Example repository implementation
 */
export class ExampleRepository extends BaseRepositoryImpl<
  ExampleEntity,
  CreateExampleDTO,
  UpdateExampleDTO
> {
  protected tableName = 'examples';
  protected db = getDatabaseConnection();

  /**
   * Create a new example entity
   */
  async create(data: CreateExampleDTO): Promise<ExampleEntity> {
    try {
      const query = `
        INSERT INTO ${this.tableName} (name, description, status, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `;
      
      const params = [data.name, data.description, data.status, data.metadata];
      const result = await this.db.query(query, params);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Failed to create example entity');
      }
      
      return this.mapRowToEntity(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create example entity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find an example entity by ID
   */
  async findById(id: string | number): Promise<ExampleEntity | null> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await this.db.query(query, [id]);
      
      if (!result.rows || result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToEntity(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to find example entity by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find all example entities with optional filtering
   */
  async findAll(filters?: Record<string, any>): Promise<ExampleEntity[]> {
    try {
      let query = `SELECT * FROM ${this.tableName}`;
      const params: any[] = [];
      
      if (filters && Object.keys(filters).length > 0) {
        const whereClause = this.buildWhereClause(filters);
        query += ` ${whereClause.sql}`;
        params.push(...whereClause.params);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await this.db.query(query, params);
      
      if (!result.rows) {
        return [];
      }
      
      return result.rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      throw new Error(`Failed to find example entities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find example entities with pagination
   */
  async findWithPagination(
    page: number,
    limit: number,
    filters?: Record<string, any>
  ): Promise<{ data: ExampleEntity[]; total: number; page: number; limit: number }> {
    try {
      // Get total count
      let countQuery = `SELECT COUNT(*) FROM ${this.tableName}`;
      const countParams: any[] = [];
      
      if (filters && Object.keys(filters).length > 0) {
        const whereClause = this.buildWhereClause(filters);
        countQuery += ` ${whereClause.sql}`;
        countParams.push(...whereClause.params);
      }
      
      const countResult = await this.db.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);
      
      // Get paginated data
      let dataQuery = `SELECT * FROM ${this.tableName}`;
      const dataParams: any[] = [];
      
      if (filters && Object.keys(filters).length > 0) {
        const whereClause = this.buildWhereClause(filters);
        dataQuery += ` ${whereClause.sql}`;
        dataParams.push(...whereClause.params);
      }
      
      const paginationClause = this.buildPaginationClause(page, limit);
      dataQuery += ` ORDER BY created_at DESC ${paginationClause.sql}`;
      dataParams.push(...paginationClause.params);
      
      const dataResult = await this.db.query(dataQuery, dataParams);
      
      const data = dataResult.rows ? dataResult.rows.map(row => this.mapRowToEntity(row)) : [];
      
      return { data, total, page, limit };
    } catch (error) {
      throw new Error(`Failed to find example entities with pagination: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an example entity by ID
   */
  async update(id: string | number, data: UpdateExampleDTO): Promise<ExampleEntity | null> {
    try {
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      
      // Build dynamic update query
      if (data.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        params.push(data.name);
      }
      
      if (data.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        params.push(data.description);
      }
      
      if (data.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        params.push(data.status);
      }
      
      if (data.metadata !== undefined) {
        updateFields.push(`metadata = $${paramIndex++}`);
        params.push(data.metadata);
      }
      
      if (updateFields.length === 0) {
        // No fields to update
        return this.findById(id);
      }
      
      updateFields.push(`updated_at = NOW()`);
      params.push(id);
      
      const query = `
        UPDATE ${this.tableName}
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await this.db.query(query, params);
      
      if (!result.rows || result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToEntity(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to update example entity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an example entity by ID
   */
  async delete(id: string | number): Promise<boolean> {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
      const result = await this.db.query(query, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete example entity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if an example entity exists
   */
  async exists(id: string | number): Promise<boolean> {
    try {
      const query = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`;
      const result = await this.db.query(query, [id]);
      
      return result.rows[0].exists;
    } catch (error) {
      throw new Error(`Failed to check if example entity exists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count example entities with optional filtering
   */
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      let query = `SELECT COUNT(*) FROM ${this.tableName}`;
      const params: any[] = [];
      
      if (filters && Object.keys(filters).length > 0) {
        const whereClause = this.buildWhereClause(filters);
        query += ` ${whereClause.sql}`;
        params.push(...whereClause.params);
      }
      
      const result = await this.db.query(query, params);
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to count example entities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find example entities by status
   */
  async findByStatus(status: 'active' | 'inactive'): Promise<ExampleEntity[]> {
    return this.findAll({ status });
  }

  /**
   * Find example entities by name (partial match)
   */
  async findByName(name: string): Promise<ExampleEntity[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE name ILIKE $1 ORDER BY created_at DESC`;
      const result = await this.db.query(query, [`%${name}%`]);
      
      if (!result.rows) {
        return [];
      }
      
      return result.rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      throw new Error(`Failed to find example entities by name: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map database row to entity
   */
  private mapRowToEntity(row: any): ExampleEntity {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      metadata: row.metadata,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }
}
