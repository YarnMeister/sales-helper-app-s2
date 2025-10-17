import { eq, desc, sql as drizzleSql } from 'drizzle-orm';
import { db } from '../../connection';
import { 
  pipedriveDealFlowData,
  pipedriveMetricData,
  flowMetricsConfig,
  type PipedriveDealFlowData,
  type NewPipedriveDealFlowData,
  type PipedriveMetricData,
  type NewPipedriveMetricData
} from '../../schema';
import { BaseRepository, BaseRepositoryImpl } from '../../core/base-repository';
import { RepositoryResult } from '../../../../types/shared/repository';
import { logInfo, logError } from '../../../log';

export interface DealMetricData {
  deal_id: number;
  start_date: string;
  end_date: string;
  duration_seconds: number;
}

export class PipedriveDealFlowRepository extends BaseRepositoryImpl<PipedriveDealFlowData> implements BaseRepository<PipedriveDealFlowData> {
  protected tableName = 'pipedrive_deal_flow_data';
  protected db = db;

  async create(data: NewPipedriveDealFlowData): Promise<RepositoryResult<PipedriveDealFlowData>> {
    try {
      const [result] = await db.insert(pipedriveDealFlowData).values(data).returning();
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to create deal flow data', 'unknown_error', error));
    }
  }

  async bulkInsertWithConflictHandling(flowDataArray: NewPipedriveDealFlowData[]): Promise<RepositoryResult<PipedriveDealFlowData[]>> {
    try {
      logInfo('Inserting deal flow data', {
        dealId: flowDataArray[0]?.dealId,
        recordCount: flowDataArray.length
      });

      const results: PipedriveDealFlowData[] = [];

      for (const data of flowDataArray) {
        try {
          const insertResult = await db
            .insert(pipedriveDealFlowData)
            .values(data)
            .onConflictDoNothing({ target: pipedriveDealFlowData.pipedriveEventId })
            .returning();

          if (insertResult.length > 0) {
            results.push(insertResult[0]);
            logInfo('Inserted new record', {
              pipedriveEventId: data.pipedriveEventId,
              dealId: data.dealId,
              stageName: data.stageName
            });
          } else {
            const [existingResult] = await db
              .select()
              .from(pipedriveDealFlowData)
              .where(eq(pipedriveDealFlowData.pipedriveEventId, data.pipedriveEventId!));

            if (existingResult) {
              results.push(existingResult);
              logInfo('Found existing record', {
                pipedriveEventId: data.pipedriveEventId,
                dealId: data.dealId,
                stageName: data.stageName
              });
            }
          }
        } catch (error) {
          logInfo('Error processing record', {
            pipedriveEventId: data.pipedriveEventId,
            dealId: data.dealId,
            stageName: data.stageName,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return RepositoryResult.success(results);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to bulk insert deal flow data', 'unknown_error', error));
    }
  }

  async findByDealId(dealId: number): Promise<RepositoryResult<PipedriveDealFlowData[]>> {
    try {
      logInfo('Fetching deal flow data', { dealId });

      const result = await db
        .select()
        .from(pipedriveDealFlowData)
        .where(eq(pipedriveDealFlowData.dealId, dealId))
        .orderBy(desc(drizzleSql`${pipedriveDealFlowData.enteredAt}::timestamp`));

      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find deal flow data by deal ID', 'unknown_error', error));
    }
  }

  async findAll(limit?: number): Promise<RepositoryResult<PipedriveDealFlowData[]>> {
    try {
      logInfo('Fetching all deal flow data', { limit });

      let query = db
        .select()
        .from(pipedriveDealFlowData)
        .orderBy(desc(drizzleSql`${pipedriveDealFlowData.enteredAt}::timestamp`));

      if (limit) {
        query = query.limit(limit) as any;
      }

      const result = await query;
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find all deal flow data', 'unknown_error', error));
    }
  }

  async getDealsForMetric(metricKey: string, period?: string): Promise<RepositoryResult<DealMetricData[]>> {
    try {
      logInfo('Fetching deals for metric', { metricKey, period });

      const [metricConfigResult] = await db
        .select({ config: flowMetricsConfig.config })
        .from(flowMetricsConfig)
        .where(eq(flowMetricsConfig.metricKey, metricKey))
        .where(eq(flowMetricsConfig.isActive, true))
        .limit(1);

      if (!metricConfigResult) {
        logInfo('No active config found for metric', { metricKey });
        return RepositoryResult.success([]);
      }

      const config = metricConfigResult.config as any;

      if (!config?.startStage?.id || !config?.endStage?.id) {
        logInfo('Invalid config structure for metric', { metricKey, config });
        return RepositoryResult.success([]);
      }

      const startStageId = config.startStage.id;
      const endStageId = config.endStage.id;

      logInfo('Using stage IDs from config', {
        metricKey,
        startStageId,
        endStageId,
        startStageName: config.startStage.name,
        endStageName: config.endStage.name
      });

      let cutoffDateFilter = drizzleSql`TRUE`;
      if (period) {
        const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '1m' ? 30 : period === '3m' ? 90 : 0;

        if (days > 0) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);
          cutoffDateFilter = drizzleSql`e.end_date >= ${cutoffDate.toISOString()}`;
        }
      }

      const result = await db.execute(drizzleSql`
        WITH deal_stages AS (
          SELECT
            deal_id,
            stage_id,
            stage_name,
            entered_at,
            ROW_NUMBER() OVER (PARTITION BY deal_id, stage_id ORDER BY entered_at) as rn
          FROM ${pipedriveDealFlowData}
          WHERE stage_id IN (${startStageId}, ${endStageId})
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
        AND ${cutoffDateFilter}
        ORDER BY e.end_date DESC
      `);

      logInfo('Deals fetched for metric', {
        metricKey,
        dealCount: (result as any).rows?.length || 0,
        period
      });

      return RepositoryResult.success((result as any).rows || []);
    } catch (error) {
      logError('Error in getDealsForMetric', {
        metricKey,
        error: error instanceof Error ? error.message : String(error)
      });
      return RepositoryResult.error(this.createError('Failed to get deals for metric', 'unknown_error', error));
    }
  }

  async findById(id: string): Promise<RepositoryResult<PipedriveDealFlowData | null>> {
    try {
      const [result] = await db.select().from(pipedriveDealFlowData).where(eq(pipedriveDealFlowData.id, id));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find deal flow data by ID', 'unknown_error', error));
    }
  }

  async update(id: string, data: Partial<NewPipedriveDealFlowData>): Promise<RepositoryResult<PipedriveDealFlowData | null>> {
    try {
      const [result] = await db.update(pipedriveDealFlowData)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(pipedriveDealFlowData.id, id))
        .returning();
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to update deal flow data', 'unknown_error', error));
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.delete(pipedriveDealFlowData).where(eq(pipedriveDealFlowData.id, id));
      return RepositoryResult.success(result.rowCount > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to delete deal flow data', 'unknown_error', error));
    }
  }

  async findWithPagination(page: number = 1, limit: number = 10): Promise<RepositoryResult<{ data: PipedriveDealFlowData[], total: number, page: number, limit: number }>> {
    try {
      const offset = (page - 1) * limit;
      const [data, totalResult] = await Promise.all([
        db.select().from(pipedriveDealFlowData).limit(limit).offset(offset).orderBy(desc(pipedriveDealFlowData.enteredAt)),
        db.select({ count: pipedriveDealFlowData.id }).from(pipedriveDealFlowData)
      ]);
      
      const total = totalResult.length;
      return RepositoryResult.success({ data, total, page, limit });
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find deal flow data with pagination', 'unknown_error', error));
    }
  }

  async exists(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.select({ id: pipedriveDealFlowData.id }).from(pipedriveDealFlowData).where(eq(pipedriveDealFlowData.id, id)).limit(1);
      return RepositoryResult.success(result.length > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to check if deal flow data exists', 'unknown_error', error));
    }
  }

  async count(): Promise<RepositoryResult<number>> {
    try {
      const result = await db.select({ count: pipedriveDealFlowData.id }).from(pipedriveDealFlowData);
      return RepositoryResult.success(result.length);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to count deal flow data', 'unknown_error', error));
    }
  }
}

export class PipedriveMetricDataRepository extends BaseRepositoryImpl<PipedriveMetricData> implements BaseRepository<PipedriveMetricData> {
  protected tableName = 'pipedrive_metric_data';
  protected db = db;

  async upsert(data: NewPipedriveMetricData): Promise<RepositoryResult<PipedriveMetricData>> {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';

      if (isDevelopment) {
        logInfo('Development mode: Would insert deal metadata', {
          dealId: data.id,
          title: data.title
        });
        return RepositoryResult.success(data as any);
      }

      const [result] = await db
        .insert(pipedriveMetricData)
        .values(data)
        .onConflictDoUpdate({
          target: pipedriveMetricData.id,
          set: {
            title: drizzleSql`EXCLUDED.title`,
            pipelineId: drizzleSql`EXCLUDED.pipeline_id`,
            stageId: drizzleSql`EXCLUDED.stage_id`,
            status: drizzleSql`EXCLUDED.status`,
            lastFetchedAt: drizzleSql`NOW()`
          }
        })
        .returning();

      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to upsert deal metadata', 'unknown_error', error));
    }
  }

  async findByDealId(dealId: number): Promise<RepositoryResult<PipedriveMetricData | null>> {
    try {
      const [result] = await db.select().from(pipedriveMetricData).where(eq(pipedriveMetricData.id, dealId));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find deal metadata by deal ID', 'unknown_error', error));
    }
  }

  async create(data: NewPipedriveMetricData): Promise<RepositoryResult<PipedriveMetricData>> {
    try {
      const [result] = await db.insert(pipedriveMetricData).values(data).returning();
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to create deal metadata', 'unknown_error', error));
    }
  }

  async findById(id: string): Promise<RepositoryResult<PipedriveMetricData | null>> {
    try {
      const [result] = await db.select().from(pipedriveMetricData).where(eq(pipedriveMetricData.id, parseInt(id)));
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find deal metadata by ID', 'unknown_error', error));
    }
  }

  async findAll(): Promise<RepositoryResult<PipedriveMetricData[]>> {
    try {
      const result = await db.select().from(pipedriveMetricData);
      return RepositoryResult.success(result);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find all deal metadata', 'unknown_error', error));
    }
  }

  async update(id: string, data: Partial<NewPipedriveMetricData>): Promise<RepositoryResult<PipedriveMetricData | null>> {
    try {
      const [result] = await db.update(pipedriveMetricData)
        .set({ ...data, lastFetchedAt: new Date() })
        .where(eq(pipedriveMetricData.id, parseInt(id)))
        .returning();
      return RepositoryResult.success(result || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to update deal metadata', 'unknown_error', error));
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.delete(pipedriveMetricData).where(eq(pipedriveMetricData.id, parseInt(id)));
      return RepositoryResult.success(result.rowCount > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to delete deal metadata', 'unknown_error', error));
    }
  }

  async findWithPagination(page: number = 1, limit: number = 10): Promise<RepositoryResult<{ data: PipedriveMetricData[], total: number, page: number, limit: number }>> {
    try {
      const offset = (page - 1) * limit;
      const [data, totalResult] = await Promise.all([
        db.select().from(pipedriveMetricData).limit(limit).offset(offset),
        db.select({ count: pipedriveMetricData.id }).from(pipedriveMetricData)
      ]);
      
      const total = totalResult.length;
      return RepositoryResult.success({ data, total, page, limit });
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to find deal metadata with pagination', 'unknown_error', error));
    }
  }

  async exists(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await db.select({ id: pipedriveMetricData.id }).from(pipedriveMetricData).where(eq(pipedriveMetricData.id, parseInt(id))).limit(1);
      return RepositoryResult.success(result.length > 0);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to check if deal metadata exists', 'unknown_error', error));
    }
  }

  async count(): Promise<RepositoryResult<number>> {
    try {
      const result = await db.select({ count: pipedriveMetricData.id }).from(pipedriveMetricData);
      return RepositoryResult.success(result.length);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to count deal metadata', 'unknown_error', error));
    }
  }
}
