import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../connection';
import { 
  siteVisits,
  type SiteVisit,
  type NewSiteVisit
} from '../../schema';
import { BaseRepository, BaseRepositoryImpl } from '../../core/base-repository';
import { RepositoryResult } from '../../../../types/shared/repository';

export class SiteVisitsRepository extends BaseRepositoryImpl<SiteVisit> implements BaseRepository<SiteVisit> {
  protected tableName = 'site_visits';
  protected db = db;

  async create(data: NewSiteVisit): Promise<RepositoryResult<SiteVisit>> {
    const operationId = `sv-create-${Date.now()}`;
    
    try {
      console.log(`[${operationId}] SiteVisitsRepository.create: Starting`, {
        salesperson: data.salesperson,
        plannedMinesCount: data.plannedMines?.length,
        mainPurpose: data.mainPurpose,
        availability: data.availability,
        hasComments: !!data.comments
      });

      // Validate required fields before insertion
      if (!data.salesperson) {
        console.error(`[${operationId}] SiteVisitsRepository.create: Missing salesperson`);
        return RepositoryResult.error(
          this.createError('Salesperson is required', 'validation_error', new Error('Missing salesperson'))
        );
      }

      if (!data.plannedMines || data.plannedMines.length === 0) {
        console.error(`[${operationId}] SiteVisitsRepository.create: Missing planned mines`);
        return RepositoryResult.error(
          this.createError('Planned mines are required', 'validation_error', new Error('Missing planned mines'))
        );
      }

      console.log(`[${operationId}] SiteVisitsRepository.create: Executing Drizzle insert`, {
        tableName: this.tableName,
        dataKeys: Object.keys(data)
      });

      const [result] = await db.insert(siteVisits).values(data).returning();

      console.log(`[${operationId}] SiteVisitsRepository.create: Success`, {
        insertedId: result.id,
        date: result.date,
        createdAt: result.createdAt
      });

      return RepositoryResult.success(result);
    } catch (error) {
      console.error(`[${operationId}] SiteVisitsRepository.create: Error`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        inputData: data
      });
      
      return RepositoryResult.error(
        this.createError('Failed to create site visit', 'unknown_error', error)
      );
    }
  }

  async findById(id: string): Promise<RepositoryResult<SiteVisit | null>> {
    try {
      const [result] = await db.select().from(siteVisits).where(eq(siteVisits.id, id));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find site visit by ID', 'unknown_error', error));
    }
  }

  async findBySalesperson(salesperson: string): Promise<RepositoryResult<SiteVisit[]>> {
    try {
      const result = await db.select().from(siteVisits)
        .where(eq(siteVisits.salesperson, salesperson))
        .orderBy(desc(siteVisits.date));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find site visits by salesperson', 'unknown_error', error));
    }
  }

  async findByDate(date: Date): Promise<RepositoryResult<SiteVisit[]>> {
    try {
      const result = await db.select().from(siteVisits)
        .where(eq(siteVisits.date, date))
        .orderBy(desc(siteVisits.createdAt));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find site visits by date', 'unknown_error', error));
    }
  }

  async findBySalespersonAndDate(salesperson: string, date: Date): Promise<RepositoryResult<SiteVisit[]>> {
    try {
      const result = await db.select().from(siteVisits)
        .where(and(eq(siteVisits.salesperson, salesperson), eq(siteVisits.date, date)))
        .orderBy(desc(siteVisits.createdAt));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find site visits by salesperson and date', 'unknown_error', error));
    }
  }

  async findAll(): Promise<RepositoryResult<SiteVisit[]>> {
    try {
      const result = await db.select().from(siteVisits).orderBy(desc(siteVisits.date));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find all site visits', 'unknown_error', error));
    }
  }

  async update(id: string, data: Partial<NewSiteVisit>): Promise<RepositoryResult<SiteVisit | null>> {
    try {
      const [result] = await db.update(siteVisits)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(siteVisits.id, id))
        .returning();
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to update site visit', 'unknown_error', error));
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.delete(siteVisits).where(eq(siteVisits.id, id));
      return RepositoryResult.success(result.rowCount > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to delete site visit', 'unknown_error', error));
    }
  }

  async findWithPagination(page: number = 1, limit: number = 10): Promise<RepositoryResult<{ data: SiteVisit[], total: number, page: number, limit: number }>> {
    try {
      const offset = (page - 1) * limit;
      const [data, totalResult] = await Promise.all([
        db.select().from(siteVisits).limit(limit).offset(offset).orderBy(desc(siteVisits.date)),
        db.select({ count: siteVisits.id }).from(siteVisits)
      ]);
      
      const total = totalResult.length;
      return RepositoryResult.success({ data, total, page, limit });
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find site visits with pagination', 'unknown_error', error));
    }
  }

  async exists(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.select({ id: siteVisits.id }).from(siteVisits).where(eq(siteVisits.id, id)).limit(1);
      return RepositoryResult.success(result.length > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to check if site visit exists', 'unknown_error', error));
    }
  }

  async count(): Promise<RepositoryResult<number>> {
    try {
      const result = await db.select({ count: siteVisits.id }).from(siteVisits);
      return RepositoryResult.success(result.length);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to count site visits', 'unknown_error', error));
    }
  }
}
