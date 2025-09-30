import { eq, and, desc, asc, gte, lte, inArray, sql } from 'drizzle-orm';
import { db } from '../connection';
import { 
  flowMetricsConfig, 
  flowMetrics,
  pipedriveMetricData,
  pipedriveDealFlowData,
  type FlowMetricsConfig,
  type NewFlowMetricsConfig,
  type FlowMetric,
  type NewFlowMetric
} from '../schema';
import { BaseRepository, BaseRepositoryImpl } from '../core/base-repository';
import { RepositoryResult } from '../../../types/shared/repository';

export class FlowMetricsRepository extends BaseRepositoryImpl<FlowMetricsConfig> implements BaseRepository<FlowMetricsConfig> {
  protected tableName = 'flow_metrics_config';
  protected db = db;

  async create(data: NewFlowMetricsConfig): Promise<RepositoryResult<FlowMetricsConfig>> {
    try {
      const [result] = await db.insert(flowMetricsConfig).values(data).returning();
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to create flow metric config', 'unknown_error', error));
    }
  }

  async findById(id: string): Promise<RepositoryResult<FlowMetricsConfig | null>> {
    try {
      const [result] = await db.select().from(flowMetricsConfig).where(eq(flowMetricsConfig.id, id));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find flow metric config by ID', 'unknown_error', error));
    }
  }

  async findByMetricKey(metricKey: string): Promise<RepositoryResult<FlowMetricsConfig | null>> {
    try {
      const [result] = await db.select().from(flowMetricsConfig).where(eq(flowMetricsConfig.metricKey, metricKey));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find flow metric config by metric key', 'unknown_error', error));
    }
  }

  async findAll(): Promise<RepositoryResult<FlowMetricsConfig[]>> {
    try {
      const result = await db.select().from(flowMetricsConfig).orderBy(asc(flowMetricsConfig.sortOrder));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find all flow metric configs', 'unknown_error', error));
    }
  }

  async findActive(): Promise<RepositoryResult<FlowMetricsConfig[]>> {
    try {
      const result = await db.select().from(flowMetricsConfig)
        .where(eq(flowMetricsConfig.isActive, true))
        .orderBy(asc(flowMetricsConfig.sortOrder));
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find active flow metric configs', 'unknown_error', error));
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
      return RepositoryResult.error(this.createError('Failed to update flow metric config', 'unknown_error', error));
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.delete(flowMetricsConfig).where(eq(flowMetricsConfig.id, id));
      return RepositoryResult.success(result.rowCount > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to delete flow metric config', 'unknown_error', error));
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
      return RepositoryResult.error(this.createError('Failed to find flow metric configs with pagination', 'unknown_error', error));
    }
  }

  async exists(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.select({ id: flowMetricsConfig.id }).from(flowMetricsConfig).where(eq(flowMetricsConfig.id, id)).limit(1);
      return RepositoryResult.success(result.length > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to check if flow metric config exists', 'unknown_error', error));
    }
  }

  async count(): Promise<RepositoryResult<number>> {
    try {
      const result = await db.select({ count: flowMetricsConfig.id }).from(flowMetricsConfig);
      return RepositoryResult.success(result.length);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to count flow metric configs', 'unknown_error', error));
    }
  }

  // Flow metrics specific methods
  async createMetric(data: NewFlowMetric): Promise<RepositoryResult<FlowMetric>> {
    try {
      const [result] = await db.insert(flowMetrics).values(data).returning();
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to create flow metric', 'unknown_error', error));
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
      return RepositoryResult.error(this.createError('Failed to get flow metrics by date range', 'unknown_error', error));
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
      return RepositoryResult.error(this.createError('Failed to get metric data by key', 'unknown_error', error));
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
      return RepositoryResult.error(this.createError('Failed to get deals for canonical stage', 'unknown_error', error));
    }
  }

  async getStageTransitionMetrics(startStageId: number, endStageId: number, startDate: Date, endDate: Date): Promise<RepositoryResult<{ dealId: number, startTime: Date, endTime: Date, durationSeconds: number }[]>> {
    try {
      // Using raw SQL to match the main branch logic exactly
      // This gets deals where the START happened within the time period (not end)
      const result = await db.execute(sql`
        WITH deal_stages AS (
          SELECT 
            deal_id,
            stage_id,
            timestamp as entered_at,
            ROW_NUMBER() OVER (PARTITION BY deal_id, stage_id ORDER BY timestamp) as rn
          FROM pipedrive_deal_flow_data
          WHERE stage_id = ${startStageId} OR stage_id = ${endStageId}
        ),
        start_stages AS (
          SELECT deal_id, entered_at as start_date
          FROM deal_stages 
          WHERE stage_id = ${startStageId} AND rn = 1
        ),
        end_stages AS (
          SELECT deal_id, entered_at as end_date
          FROM deal_stages 
          WHERE stage_id = ${endStageId} AND rn = 1
        )
        SELECT 
          s.deal_id,
          s.start_date,
          e.end_date,
          EXTRACT(EPOCH FROM (e.end_date - s.start_date))::BIGINT as duration_seconds
        FROM start_stages s
        JOIN end_stages e ON s.deal_id = e.deal_id
        WHERE e.end_date > s.start_date
        AND s.start_date >= ${startDate.toISOString()}
        AND s.start_date <= ${endDate.toISOString()}
        ORDER BY s.start_date DESC
      `);
      
      const transitions = result.rows.map((row: any) => ({
        dealId: parseInt(row.deal_id),
        startTime: new Date(row.start_date),
        endTime: new Date(row.end_date),
        durationSeconds: parseInt(row.duration_seconds)
      }));
      
      return RepositoryResult.success(transitions);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to get stage transition metrics', 'unknown_error', error));
    }
  }
}

// Removed: CanonicalStageMappingsRepository class (canonical_stage_mappings table dropped)
// JSONB config in flow_metrics_config replaces the need for separate mappings table
