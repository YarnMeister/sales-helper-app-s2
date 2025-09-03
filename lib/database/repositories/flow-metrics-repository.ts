import { eq, and, desc, asc, gte, lte } from 'drizzle-orm';
import { db } from '../connection';
import { 
  flowMetricsConfig, 
  canonicalStageMappings, 
  flowMetrics,
  pipedriveMetricData,
  pipedriveDealFlowData,
  type FlowMetricsConfig,
  type NewFlowMetricsConfig,
  type CanonicalStageMapping,
  type NewCanonicalStageMapping,
  type FlowMetric,
  type NewFlowMetric
} from '../schema';
import { BaseRepository } from '../core/base-repository';
import { RepositoryResult } from '../../../types/shared/repository';

export class FlowMetricsRepository implements BaseRepository<FlowMetricsConfig> {
  async create(data: NewFlowMetricsConfig): Promise<RepositoryResult<FlowMetricsConfig>> {
    try {
      const [result] = await db.insert(flowMetricsConfig).values(data).returning();
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error('Failed to create flow metric config', error);
    }
  }

  async findById(id: string): Promise<RepositoryResult<FlowMetricsConfig | null>> {
    try {
      const [result] = await db.select().from(flowMetricsConfig).where(eq(flowMetricsConfig.id, id));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error('Failed to find flow metric config by ID', error);
    }
  }

  async findByMetricKey(metricKey: string): Promise<RepositoryResult<FlowMetricsConfig | null>> {
    try {
      const [result] = await db.select().from(flowMetricsConfig).where(eq(flowMetricsConfig.metricKey, metricKey));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error('Failed to find flow metric config by metric key', error);
    }
  }

  async findAll(): Promise<RepositoryResult<FlowMetricsConfig[]>> {
    try {
      const result = await db.select().from(flowMetricsConfig).orderBy(asc(flowMetricsConfig.sortOrder));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error('Failed to find all flow metric configs', error);
    }
  }

  async findActive(): Promise<RepositoryResult<FlowMetricsConfig[]>> {
    try {
      const result = await db.select().from(flowMetricsConfig)
        .where(eq(flowMetricsConfig.isActive, true))
        .orderBy(asc(flowMetricsConfig.sortOrder));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error('Failed to find active flow metric configs', error);
    }
  }

  async update(id: string, data: Partial<NewFlowMetricsConfig>): Promise<RepositoryResult<FlowMetricsConfig | null>> {
    try {
      const [result] = await db.update(flowMetricsConfig)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(flowMetricsConfig.id, id))
        .returning();
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error('Failed to update flow metric config', error);
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.delete(flowMetricsConfig).where(eq(flowMetricsConfig.id, id));
      return RepositoryResult.success(result.rowCount > 0);
    } catch (error) {
      return RepositoryResult.error('Failed to delete flow metric config', error);
    }
  }

  async findWithPagination(page: number = 1, limit: number = 10): Promise<RepositoryResult<{ data: FlowMetricsConfig[], total: number, page: number, limit: number }>> {
    try {
      const offset = (page - 1) * limit;
      const [data, totalResult] = await Promise.all([
        db.select().from(flowMetricsConfig).limit(limit).offset(offset).orderBy(asc(flowMetricsConfig.sortOrder)),
        db.select({ count: flowMetricsConfig.id }).from(flowMetricsConfig)
      ]);
      
      const total = totalResult.length;
      return RepositoryResult.success({ data, total, page, limit });
    } catch (error) {
      return RepositoryResult.error('Failed to find flow metric configs with pagination', error);
    }
  }

  async exists(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.select({ id: flowMetricsConfig.id }).from(flowMetricsConfig).where(eq(flowMetricsConfig.id, id)).limit(1);
      return RepositoryResult.success(result.length > 0);
    } catch (error) {
      return RepositoryResult.error('Failed to check if flow metric config exists', error);
    }
  }

  async count(): Promise<RepositoryResult<number>> {
    try {
      const result = await db.select({ count: flowMetricsConfig.id }).from(flowMetricsConfig);
      return RepositoryResult.success(result.length);
    } catch (error) {
      return RepositoryResult.error('Failed to count flow metric configs', error);
    }
  }

  // Flow metrics specific methods
  async createMetric(data: NewFlowMetric): Promise<RepositoryResult<FlowMetric>> {
    try {
      const [result] = await db.insert(flowMetrics).values(data).returning();
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error('Failed to create flow metric', error);
    }
  }

  async getMetricsByDateRange(startDate: Date, endDate: Date): Promise<RepositoryResult<FlowMetric[]>> {
    try {
      const result = await db.select().from(flowMetrics)
        .where(and(
          gte(flowMetrics.startDate, startDate),
          lte(flowMetrics.endDate, endDate)
        ))
        .orderBy(desc(flowMetrics.startDate));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error('Failed to get flow metrics by date range', error);
    }
  }

  async getMetricDataByKey(metricKey: string, startDate: Date, endDate: Date): Promise<RepositoryResult<any[]>> {
    try {
      const result = await db.select({
        metricKey: pipedriveMetricData.metricKey,
        dealId: pipedriveMetricData.dealId,
        startStageId: pipedriveMetricData.startStageId,
        endStageId: pipedriveMetricData.endStageId,
        startTimestamp: pipedriveMetricData.startTimestamp,
        endTimestamp: pipedriveMetricData.endTimestamp,
        durationDays: pipedriveMetricData.durationDays,
      })
      .from(pipedriveMetricData)
      .where(and(
        eq(pipedriveMetricData.metricKey, metricKey),
        gte(pipedriveMetricData.startTimestamp, startDate),
        lte(pipedriveMetricData.endTimestamp, endDate)
      ));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error('Failed to get metric data by key', error);
    }
  }

  async getDealsForCanonicalStage(canonicalStage: string, startDate: Date, endDate: Date): Promise<RepositoryResult<any[]>> {
    try {
      const result = await db.select({
        dealId: pipedriveDealFlowData.dealId,
        stageName: pipedriveDealFlowData.stageName,
        timestamp: pipedriveDealFlowData.timestamp,
      })
      .from(pipedriveDealFlowData)
      .where(and(
        gte(pipedriveDealFlowData.timestamp, startDate),
        lte(pipedriveDealFlowData.timestamp, endDate)
      ))
      .orderBy(desc(pipedriveDealFlowData.timestamp));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error('Failed to get deals for canonical stage', error);
    }
  }
}

export class CanonicalStageMappingsRepository implements BaseRepository<CanonicalStageMapping> {
  async create(data: NewCanonicalStageMapping): Promise<RepositoryResult<CanonicalStageMapping>> {
    try {
      const [result] = await db.insert(canonicalStageMappings).values(data).returning();
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error('Failed to create canonical stage mapping', error);
    }
  }

  async findById(id: string): Promise<RepositoryResult<CanonicalStageMapping | null>> {
    try {
      const [result] = await db.select().from(canonicalStageMappings).where(eq(canonicalStageMappings.id, id));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error('Failed to find canonical stage mapping by ID', error);
    }
  }

  async findByCanonicalStage(canonicalStage: string): Promise<RepositoryResult<CanonicalStageMapping[]>> {
    try {
      const result = await db.select().from(canonicalStageMappings)
        .where(eq(canonicalStageMappings.canonicalStage, canonicalStage));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error('Failed to find canonical stage mappings by stage', error);
    }
  }

  async findAll(): Promise<RepositoryResult<CanonicalStageMapping[]>> {
    try {
      const result = await db.select().from(canonicalStageMappings);
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error('Failed to find all canonical stage mappings', error);
    }
  }

  async update(id: string, data: Partial<NewCanonicalStageMapping>): Promise<RepositoryResult<CanonicalStageMapping | null>> {
    try {
      const [result] = await db.update(canonicalStageMappings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(canonicalStageMappings.id, id))
        .returning();
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error('Failed to update canonical stage mapping', error);
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.delete(canonicalStageMappings).where(eq(canonicalStageMappings.id, id));
      return RepositoryResult.success(result.rowCount > 0);
    } catch (error) {
      return RepositoryResult.error('Failed to delete canonical stage mapping', error);
    }
  }

  // Get mappings with config data
  async getMappingsWithConfig(): Promise<RepositoryResult<any[]>> {
    try {
      const result = await db.select({
        id: canonicalStageMappings.id,
        metricConfigId: canonicalStageMappings.metricConfigId,
        canonicalStage: canonicalStageMappings.canonicalStage,
        startStage: canonicalStageMappings.startStage,
        endStage: canonicalStageMappings.endStage,
        startStageId: canonicalStageMappings.startStageId,
        endStageId: canonicalStageMappings.endStageId,
        avgMinDays: canonicalStageMappings.avgMinDays,
        avgMaxDays: canonicalStageMappings.avgMaxDays,
        metricComment: canonicalStageMappings.metricComment,
        createdAt: canonicalStageMappings.createdAt,
        updatedAt: canonicalStageMappings.updatedAt,
        // Config data
        metricKey: flowMetricsConfig.metricKey,
        displayTitle: flowMetricsConfig.displayTitle,
        sortOrder: flowMetricsConfig.sortOrder,
        isActive: flowMetricsConfig.isActive,
      })
      .from(canonicalStageMappings)
      .leftJoin(flowMetricsConfig, eq(canonicalStageMappings.metricConfigId, flowMetricsConfig.id))
      .orderBy(asc(flowMetricsConfig.sortOrder), asc(canonicalStageMappings.canonicalStage));
      
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error('Failed to get mappings with config', error);
    }
  }

  async findWithPagination(page: number = 1, limit: number = 10): Promise<RepositoryResult<{ data: CanonicalStageMapping[], total: number, page: number, limit: number }>> {
    try {
      const offset = (page - 1) * limit;
      const [data, totalResult] = await Promise.all([
        db.select().from(canonicalStageMappings).limit(limit).offset(offset),
        db.select({ count: canonicalStageMappings.id }).from(canonicalStageMappings)
      ]);
      
      const total = totalResult.length;
      return RepositoryResult.success({ data, total, page, limit });
    } catch (error) {
      return RepositoryResult.error('Failed to find canonical stage mappings with pagination', error);
    }
  }

  async exists(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.select({ id: canonicalStageMappings.id }).from(canonicalStageMappings).where(eq(canonicalStageMappings.id, id)).limit(1);
      return RepositoryResult.success(result.length > 0);
    } catch (error) {
      return RepositoryResult.error('Failed to check if canonical stage mapping exists', error);
    }
  }

  async count(): Promise<RepositoryResult<number>> {
    try {
      const result = await db.select({ count: canonicalStageMappings.id }).from(canonicalStageMappings);
      return RepositoryResult.success(result.length);
    } catch (error) {
      return RepositoryResult.error('Failed to count canonical stage mappings', error);
    }
  }
}
