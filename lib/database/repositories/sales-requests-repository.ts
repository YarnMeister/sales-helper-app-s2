import { eq, and, desc, asc, like, gte, lte } from 'drizzle-orm';
import { db } from '../connection';
import { 
  requests, 
  mockRequests, 
  siteVisits,
  pipedriveSubmissions,
  type Request,
  type NewRequest,
  type MockRequest,
  type NewMockRequest,
  type SiteVisit,
  type NewSiteVisit,
  type PipedriveSubmission,
  type NewPipedriveSubmission
} from '../schema';
import { BaseRepository, BaseRepositoryImpl } from '../core/base-repository';
import { RepositoryResult } from '../../../types/shared/repository';

export class SalesRequestsRepository extends BaseRepositoryImpl<Request> implements BaseRepository<Request> {
  protected tableName = 'requests';
  protected db = db;

  async create(data: NewRequest): Promise<RepositoryResult<Request>> {
    try {
      const [result] = await db.insert(requests).values(data).returning();
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to create request', 'unknown_error', error));
    }
  }

  async findById(id: string): Promise<RepositoryResult<Request | null>> {
    try {
      const [result] = await db.select().from(requests).where(eq(requests.id, id));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find request by ID', 'unknown_error', error));
    }
  }

  async findByRequestId(requestId: string): Promise<RepositoryResult<Request | null>> {
    try {
      const [result] = await db.select().from(requests).where(eq(requests.requestId, requestId));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find request by request ID', 'unknown_error', error));
    }
  }

  async findAll(): Promise<RepositoryResult<Request[]>> {
    try {
      const result = await db.select().from(requests).orderBy(desc(requests.createdAt));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find all requests', 'unknown_error', error));
    }
  }

  async findByStatus(status: string): Promise<RepositoryResult<Request[]>> {
    try {
      const result = await db.select().from(requests)
        .where(eq(requests.status, status as any))
        .orderBy(desc(requests.createdAt));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find requests by status', 'unknown_error', error));
    }
  }

  async findBySalesperson(salesperson: string): Promise<RepositoryResult<Request[]>> {
    try {
      const result = await db.select().from(requests)
        .where(eq(requests.salespersonSelection, salesperson))
        .orderBy(desc(requests.createdAt));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find requests by salesperson', 'unknown_error', error));
    }
  }

  async findByMineGroup(mineGroup: string): Promise<RepositoryResult<Request[]>> {
    try {
      const result = await db.select().from(requests)
        .where(eq(requests.contactMineGroup, mineGroup))
        .orderBy(desc(requests.createdAt));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find requests by mine group', 'unknown_error', error));
    }
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<RepositoryResult<Request[]>> {
    try {
      const result = await db.select().from(requests)
        .where(and(
          gte(requests.createdAt, startDate),
          lte(requests.createdAt, endDate)
        ))
        .orderBy(desc(requests.createdAt));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find requests by date range', 'unknown_error', error));
    }
  }

  async update(id: string, data: Partial<NewRequest>): Promise<RepositoryResult<Request | null>> {
    try {
      const [result] = await db.update(requests)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(requests.id, id))
        .returning();
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to update request', 'unknown_error', error));
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.delete(requests).where(eq(requests.id, id));
      return RepositoryResult.success(result.rowCount > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to delete request', 'unknown_error', error));
    }
  }

  // Search requests with filters
  async search(filters: {
    status?: string;
    salesperson?: string;
    mineGroup?: string;
    mineName?: string;
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
  }): Promise<RepositoryResult<Request[]>> {
    try {
      let query = db.select().from(requests);
      const conditions = [];

      if (filters.status) {
        conditions.push(eq(requests.status, filters.status as any));
      }
      if (filters.salesperson) {
        conditions.push(eq(requests.salespersonSelection, filters.salesperson));
      }
      if (filters.mineGroup) {
        conditions.push(eq(requests.contactMineGroup, filters.mineGroup));
      }
      if (filters.mineName) {
        conditions.push(eq(requests.contactMineName, filters.mineName));
      }
      if (filters.startDate) {
        conditions.push(gte(requests.createdAt, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(requests.createdAt, filters.endDate));
      }
      if (filters.searchTerm) {
        conditions.push(like(requests.comment, `%${filters.searchTerm}%`));
      }

      if (conditions.length > 0) {
        const result = await query.where(and(...conditions)).orderBy(desc(requests.createdAt));
        return RepositoryResult.success(result);
      } else {
        const result = await query.orderBy(desc(requests.createdAt));
        return RepositoryResult.success(result);
      }
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to search requests', 'unknown_error', error));
    }
  }

  async findWithPagination(page: number = 1, limit: number = 10): Promise<RepositoryResult<{ data: Request[], total: number, page: number, limit: number }>> {
    try {
      const offset = (page - 1) * limit;
      const [data, totalResult] = await Promise.all([
        db.select().from(requests).limit(limit).offset(offset).orderBy(desc(requests.createdAt)),
        db.select({ count: requests.id }).from(requests)
      ]);
      
      const total = totalResult.length;
      return RepositoryResult.success({ data, total, page, limit });
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find requests with pagination', 'unknown_error', error));
    }
  }

  async exists(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.select({ id: requests.id }).from(requests).where(eq(requests.id, id)).limit(1);
      return RepositoryResult.success(result.length > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to check if request exists', 'unknown_error', error));
    }
  }

  async count(): Promise<RepositoryResult<number>> {
    try {
      const result = await db.select({ count: requests.id }).from(requests);
      return RepositoryResult.success(result.length);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to count requests', 'unknown_error', error));
    }
  }
}

export class MockRequestsRepository extends BaseRepositoryImpl<MockRequest> implements BaseRepository<MockRequest> {
  protected tableName = 'mock_requests';
  protected db = db;

  async create(data: NewMockRequest): Promise<RepositoryResult<MockRequest>> {
    try {
      const [result] = await db.insert(mockRequests).values(data).returning();
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to create mock request', 'unknown_error', error));
    }
  }

  async findById(id: string): Promise<RepositoryResult<MockRequest | null>> {
    try {
      const [result] = await db.select().from(mockRequests).where(eq(mockRequests.id, id));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find mock request by ID', 'unknown_error', error));
    }
  }

  async findByRequestId(requestId: string): Promise<RepositoryResult<MockRequest | null>> {
    try {
      const [result] = await db.select().from(mockRequests).where(eq(mockRequests.requestId, requestId));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find mock request by request ID', 'unknown_error', error));
    }
  }

  async findAll(): Promise<RepositoryResult<MockRequest[]>> {
    try {
      const result = await db.select().from(mockRequests).orderBy(desc(mockRequests.createdAt));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find all mock requests', 'unknown_error', error));
    }
  }

  async update(id: string, data: Partial<NewMockRequest>): Promise<RepositoryResult<MockRequest | null>> {
    try {
      const [result] = await db.update(mockRequests)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(mockRequests.id, id))
        .returning();
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to update mock request', 'unknown_error', error));
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.delete(mockRequests).where(eq(mockRequests.id, id));
      return RepositoryResult.success(result.rowCount > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to delete mock request', 'unknown_error', error));
    }
  }

  async findWithPagination(page: number = 1, limit: number = 10): Promise<RepositoryResult<{ data: MockRequest[], total: number, page: number, limit: number }>> {
    try {
      const offset = (page - 1) * limit;
      const [data, totalResult] = await Promise.all([
        db.select().from(mockRequests).limit(limit).offset(offset).orderBy(desc(mockRequests.createdAt)),
        db.select({ count: mockRequests.id }).from(mockRequests)
      ]);
      
      const total = totalResult.length;
      return RepositoryResult.success({ data, total, page, limit });
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find mock requests with pagination', 'unknown_error', error));
    }
  }

  async exists(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.select({ id: mockRequests.id }).from(mockRequests).where(eq(mockRequests.id, id)).limit(1);
      return RepositoryResult.success(result.length > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to check if mock request exists', 'unknown_error', error));
    }
  }

  async count(): Promise<RepositoryResult<number>> {
    try {
      const result = await db.select({ count: mockRequests.id }).from(mockRequests);
      return RepositoryResult.success(result.length);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to count mock requests', 'unknown_error', error));
    }
  }
}

export class SiteVisitsRepository extends BaseRepositoryImpl<SiteVisit> implements BaseRepository<SiteVisit> {
  protected tableName = 'site_visits';
  protected db = db;

  async create(data: NewSiteVisit): Promise<RepositoryResult<SiteVisit>> {
    try {
      const [result] = await db.insert(siteVisits).values(data).returning();
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to create site visit', 'unknown_error', error));
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

export class PipedriveSubmissionsRepository extends BaseRepositoryImpl<PipedriveSubmission> implements BaseRepository<PipedriveSubmission> {
  protected tableName = 'pipedrive_submissions';
  protected db = db;

  async create(data: NewPipedriveSubmission): Promise<RepositoryResult<PipedriveSubmission>> {
    try {
      const [result] = await db.insert(pipedriveSubmissions).values(data).returning();
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to create Pipedrive submission', 'unknown_error', error));
    }
  }

  async findById(id: string): Promise<RepositoryResult<PipedriveSubmission | null>> {
    try {
      const [result] = await db.select().from(pipedriveSubmissions).where(eq(pipedriveSubmissions.id, id));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find Pipedrive submission by ID', 'unknown_error', error));
    }
  }

  async findByRequestId(requestId: string): Promise<RepositoryResult<PipedriveSubmission | null>> {
    try {
      const [result] = await db.select().from(pipedriveSubmissions).where(eq(pipedriveSubmissions.requestId, requestId));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find Pipedrive submission by request ID', 'unknown_error', error));
    }
  }

  async findByDealId(dealId: number): Promise<RepositoryResult<PipedriveSubmission | null>> {
    try {
      const [result] = await db.select().from(pipedriveSubmissions).where(eq(pipedriveSubmissions.simulatedDealId, dealId));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find Pipedrive submission by deal ID', 'unknown_error', error));
    }
  }

  async findAll(): Promise<RepositoryResult<PipedriveSubmission[]>> {
    try {
      const result = await db.select().from(pipedriveSubmissions).orderBy(desc(pipedriveSubmissions.createdAt));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find all Pipedrive submissions', 'unknown_error', error));
    }
  }

  async update(id: string, data: Partial<NewPipedriveSubmission>): Promise<RepositoryResult<PipedriveSubmission | null>> {
    try {
      const [result] = await db.update(pipedriveSubmissions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(pipedriveSubmissions.id, id))
        .returning();
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to update Pipedrive submission', 'unknown_error', error));
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.delete(pipedriveSubmissions).where(eq(pipedriveSubmissions.id, id));
      return RepositoryResult.success(result.rowCount > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to delete Pipedrive submission', 'unknown_error', error));
    }
  }

  async findWithPagination(page: number = 1, limit: number = 10): Promise<RepositoryResult<{ data: PipedriveSubmission[], total: number, page: number, limit: number }>> {
    try {
      const offset = (page - 1) * limit;
      const [data, totalResult] = await Promise.all([
        db.select().from(pipedriveSubmissions).limit(limit).offset(offset).orderBy(desc(pipedriveSubmissions.createdAt)),
        db.select({ count: pipedriveSubmissions.id }).from(pipedriveSubmissions)
      ]);
      
      const total = totalResult.length;
      return RepositoryResult.success({ data, total, page, limit });
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find Pipedrive submissions with pagination', 'unknown_error', error));
    }
  }

  async exists(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.select({ id: pipedriveSubmissions.id }).from(pipedriveSubmissions).where(eq(pipedriveSubmissions.id, id)).limit(1);
      return RepositoryResult.success(result.length > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to check if Pipedrive submission exists', 'unknown_error', error));
    }
  }

  async count(): Promise<RepositoryResult<number>> {
    try {
      const result = await db.select({ count: pipedriveSubmissions.id }).from(pipedriveSubmissions);
      return RepositoryResult.success(result.length);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to count Pipedrive submissions', 'unknown_error', error));
    }
  }
}
