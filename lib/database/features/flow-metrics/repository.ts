import { BaseRepositoryImpl } from '../../core/base-repository';
import { RepositoryResult } from '../../../../types/shared/repository';
import { db } from '../../connection';
import { createStandardConnection } from '../../connection-standard';
import { 
  flowMetricsConfig, 
  dealFlowSyncStatus, 
  pipedriveDealFlowData 
} from '../../schema';
import { eq, desc, lt, and, sql, asc } from 'drizzle-orm';
import { logInfo, logError } from '../../../log';

// Types for the repository
export interface FlowMetricsConfig {
  id: string;
  metricKey: string;
  displayTitle: string;
  config: any; // JSONB
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealFlowSyncStatus {
  id: string;
  syncType: 'full' | 'incremental';
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  totalDeals?: number;
  processedDeals?: number;
  successfulDeals?: number;
  failedDeals?: any; // JSONB array
  errors?: any; // JSONB array
  duration?: number;
  createdAt: Date;
}

export interface DealFlowData {
  id: string;
  dealId: number;
  pipelineId: number;
  stageId: number;
  stageName: string;
  enteredAt: Date;
  leftAt?: Date;
  durationSeconds?: number;
  createdAt: Date;
  updatedAt?: Date;
  pipedriveEventId: number;
}

export interface MetricConfigJSON {
  pipeline: {
    id: number;
    name: string;
  };
  startStage: {
    id: number;
    name: string;
  };
  endStage: {
    id: number;
    name: string;
  };
  thresholds?: {
    minDays?: number;
    maxDays?: number;
  };
  comment?: string;
}

export class FlowMetricsRepository extends BaseRepositoryImpl<FlowMetricsConfig> {
  protected tableName = 'flow_metrics_config';
  protected db = db;

  async create(data: any): Promise<RepositoryResult<FlowMetricsConfig>> {
    try {
      const [result] = await this.db.insert(flowMetricsConfig).values(data).returning();
      return RepositoryResult.success(result as FlowMetricsConfig);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to create metric config', 'unknown_error', error));
    }
  }

  async findById(id: string): Promise<RepositoryResult<FlowMetricsConfig | null>> {
    try {
      const result = await this.db
        .select()
        .from(flowMetricsConfig)
        .where(eq(flowMetricsConfig.id, id))
        .limit(1);
      
      return RepositoryResult.success(result[0] as FlowMetricsConfig || null);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to find metric config', 'unknown_error', error));
    }
  }

  async findAll(): Promise<RepositoryResult<FlowMetricsConfig[]>> {
    try {
      const result = await this.db
        .select()
        .from(flowMetricsConfig)
        .orderBy(flowMetricsConfig.sortOrder);

      return RepositoryResult.success(result as FlowMetricsConfig[]);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to find metric configs', 'unknown_error', error));
    }
  }

  async getActive(): Promise<RepositoryResult<FlowMetricsConfig[]>> {
    try {
      logInfo('Fetching active flow metrics configuration');
      
      const { db: standardDb } = createStandardConnection();
      const result = await standardDb
        .select()
        .from(flowMetricsConfig)
        .where(eq(flowMetricsConfig.isActive, true))
        .orderBy(asc(flowMetricsConfig.sortOrder), asc(flowMetricsConfig.displayTitle));

      logInfo('Active flow metrics configuration result', {
        totalCount: result.length,
        metrics: result.map((m: any) => ({
          id: m.id,
          title: m.displayTitle,
          metricKey: m.metricKey,
          isActive: m.isActive,
          sortOrder: m.sortOrder
        }))
      });

      return RepositoryResult.success(result as FlowMetricsConfig[]);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to get active metrics', 'unknown_error', error));
    }
  }

  async reorderMetrics(reorderData: Array<{ id: string; sortOrder: number }>): Promise<RepositoryResult<boolean>> {
    try {
      logInfo('Reordering flow metrics', { count: reorderData.length });

      for (const item of reorderData) {
        await db.update(flowMetricsConfig)
          .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
          .where(eq(flowMetricsConfig.id, item.id));
      }

      return RepositoryResult.success(true);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to reorder flow metrics', 'unknown_error', error));
    }
  }

  async updateComment(id: string, comment: string): Promise<RepositoryResult<FlowMetricsConfig | null>> {
    try {
      logInfo('Updating flow metric comment', { id });

      const getResult = await this.findById(id);
      if (getResult.isError() || !getResult.getData()) {
        return RepositoryResult.error(
          this.createError('Flow metric config not found', 'not_found', new Error('Config not found'))
        );
      }

      const currentConfig = getResult.getData();
      const updatedConfig = {
        ...(currentConfig.config as any),
        comment
      };

      const [result] = await db.update(flowMetricsConfig)
        .set({ 
          config: updatedConfig as any,
          updatedAt: new Date() 
        })
        .where(eq(flowMetricsConfig.id, id))
        .returning();

      return RepositoryResult.success(result as FlowMetricsConfig || null);
    } catch (error) {
      return RepositoryResult.error(this.createError('Failed to update flow metric comment', 'unknown_error', error));
    }
  }

  async getByKey(metricKey: string): Promise<RepositoryResult<FlowMetricsConfig | null>> {
    try {
      const result = await this.db
        .select()
        .from(flowMetricsConfig)
        .where(eq(flowMetricsConfig.metricKey, metricKey))
        .limit(1);

      return RepositoryResult.success(result[0] as FlowMetricsConfig || null);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to find metric by key', 'unknown_error', error));
    }
  }

  async createWithConfig(data: {
    metricKey: string;
    displayTitle: string;
    config: MetricConfigJSON;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<RepositoryResult<FlowMetricsConfig>> {
    try {
      const [result] = await this.db.insert(flowMetricsConfig).values({
        metricKey: data.metricKey,
        displayTitle: data.displayTitle,
        config: data.config as any,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== false,
      }).returning();
      
      return RepositoryResult.success(result as FlowMetricsConfig);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to create metric with config', 'unknown_error', error));
    }
  }

  async updateConfig(id: string, config: MetricConfigJSON): Promise<RepositoryResult<FlowMetricsConfig | null>> {
    try {
      const [result] = await this.db
        .update(flowMetricsConfig)
        .set({ config: config as any, updatedAt: new Date() })
        .where(eq(flowMetricsConfig.id, id))
        .returning();

      return RepositoryResult.success(result as FlowMetricsConfig || null);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to update config', 'unknown_error', error));
    }
  }

  // Sync status methods
  async recordSyncStatus(status: Partial<DealFlowSyncStatus>): Promise<RepositoryResult<DealFlowSyncStatus>> {
    try {
      const [result] = await this.db.insert(dealFlowSyncStatus).values(status as any).returning();
      return RepositoryResult.success(result as DealFlowSyncStatus);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to record sync status', 'unknown_error', error));
    }
  }

  async updateSyncStatus(id: string, updates: Partial<DealFlowSyncStatus>): Promise<RepositoryResult<DealFlowSyncStatus | null>> {
    try {
      const [result] = await this.db
        .update(dealFlowSyncStatus)
        .set(updates as any)
        .where(eq(dealFlowSyncStatus.id, id))
        .returning();

      return RepositoryResult.success(result as DealFlowSyncStatus || null);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to update sync status', 'unknown_error', error));
    }
  }

  async getLastSyncTimestamp(): Promise<RepositoryResult<number>> {
    try {
      const result = await this.db
        .select({ completedAt: dealFlowSyncStatus.completedAt })
        .from(dealFlowSyncStatus)
        .where(eq(dealFlowSyncStatus.status, 'completed'))
        .orderBy(desc(dealFlowSyncStatus.completedAt))
        .limit(1);
      
      const timestamp = result[0]?.completedAt?.getTime() || 0;
      return RepositoryResult.success(timestamp);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to get last sync timestamp', 'unknown_error', error));
    }
  }

  async getRecentSyncHistory(limit: number = 10): Promise<RepositoryResult<DealFlowSyncStatus[]>> {
    try {
      const result = await this.db
        .select()
        .from(dealFlowSyncStatus)
        .orderBy(desc(dealFlowSyncStatus.startedAt))
        .limit(limit);

      return RepositoryResult.success(result as DealFlowSyncStatus[]);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to get sync history', 'unknown_error', error));
    }
  }

  // Deal flow data methods
  async upsertDealFlowData(flowData: Partial<DealFlowData>[]): Promise<RepositoryResult<number>> {
    try {
      let insertedCount = 0;

      for (const data of flowData) {
        try {
          await this.db
            .insert(pipedriveDealFlowData)
            .values(data as any)
            .onConflictDoUpdate({
              target: pipedriveDealFlowData.pipedriveEventId,
              set: {
                stageName: sql`EXCLUDED.stage_name`,
                leftAt: sql`EXCLUDED.left_at`,
                durationSeconds: sql`EXCLUDED.duration_seconds`,
                updatedAt: sql`NOW()`
              }
            });
          insertedCount++;
        } catch (error) {
          console.warn(`Failed to upsert flow data for deal ${data.dealId}:`, error);
        }
      }

      return RepositoryResult.success(insertedCount);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to upsert deal flow data', 'unknown_error', error));
    }
  }

  async cleanupOldFlowData(daysBack: number): Promise<RepositoryResult<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const result = await this.db
        .delete(pipedriveDealFlowData)
        .where(lt(pipedriveDealFlowData.enteredAt, cutoffDate));

      return RepositoryResult.success(result.rowCount || 0);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to cleanup old flow data', 'unknown_error', error));
    }
  }

  async getFlowDataStats(): Promise<RepositoryResult<{
    totalRecords: number;
    oldestRecord?: Date;
    newestRecord?: Date;
    lastSyncTime?: Date;
  }>> {
    try {
      const [countResult] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(pipedriveDealFlowData);
      
      const [dateResult] = await this.db
        .select({
          oldest: sql<Date>`min(entered_at)`,
          newest: sql<Date>`max(entered_at)`
        })
        .from(pipedriveDealFlowData);
      
      const [syncResult] = await this.db
        .select({ lastSync: dealFlowSyncStatus.completedAt })
        .from(dealFlowSyncStatus)
        .where(eq(dealFlowSyncStatus.status, 'completed'))
        .orderBy(desc(dealFlowSyncStatus.completedAt))
        .limit(1);
      
      return RepositoryResult.success({
        totalRecords: countResult.count,
        oldestRecord: dateResult.oldest,
        newestRecord: dateResult.newest,
        lastSyncTime: syncResult?.lastSync || undefined
      });
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to get flow data stats', 'unknown_error', error));
    }
  }

  // Required abstract methods
  async findWithPagination(): Promise<RepositoryResult<any>> {
    throw new Error('findWithPagination not implemented for FlowMetricsRepository');
  }

  async update(id: string, data: Partial<FlowMetricsConfig>): Promise<RepositoryResult<FlowMetricsConfig | null>> {
    try {
      const [result] = await this.db
        .update(flowMetricsConfig)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(flowMetricsConfig.id, id))
        .returning();

      return RepositoryResult.success(result as FlowMetricsConfig || null);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to update metric', 'unknown_error', error));
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const [result] = await this.db
        .delete(flowMetricsConfig)
        .where(eq(flowMetricsConfig.id, id))
        .returning();

      if (!result) {
        return RepositoryResult.error(new ConcreteRepositoryError('Flow metric configuration not found', 'not_found'));
      }

      return RepositoryResult.success(true);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to delete metric', 'unknown_error', error));
    }
  }

  async deleteAndReturn(id: string): Promise<RepositoryResult<FlowMetricsConfig | null>> {
    try {
      const [result] = await this.db
        .delete(flowMetricsConfig)
        .where(eq(flowMetricsConfig.id, id))
        .returning();

      if (!result) {
        return RepositoryResult.error(new ConcreteRepositoryError('Flow metric configuration not found', 'not_found'));
      }

      return RepositoryResult.success(result as FlowMetricsConfig);
    } catch (error) {
      return RepositoryResult.error(new ConcreteRepositoryError('Failed to delete metric', 'unknown_error', error));
    }
  }

  async count(): Promise<RepositoryResult<any>> {
    throw new Error('count not implemented for FlowMetricsRepository');
  }
}
