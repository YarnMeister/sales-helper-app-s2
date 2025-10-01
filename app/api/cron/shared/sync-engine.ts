import { RateLimiter } from './rate-limiter';
import { ProgressTracker } from './progress-tracker';
import { FlowMetricsRepository } from '../../../../lib/database/features/flow-metrics/repository';
import { fetchAllDealsUpdatedSince, fetchDealFlow } from '../../../../lib/pipedrive';

export interface SyncOptions {
  mode: 'full' | 'incremental';
  daysBack?: number;
  batchSize?: number;
  maxRetries?: number;
}

export interface SyncResult {
  totalDeals: number;
  processedDeals: number;
  successfulDeals: number;
  failedDeals: string[];
  duration: number;
  errors: string[];
}

export class DealFlowSyncEngine {
  private rateLimiter: RateLimiter;
  private progressTracker: ProgressTracker;
  private repository: FlowMetricsRepository;
  
  constructor() {
    this.rateLimiter = new RateLimiter(40, 2000); // 40 req/2sec
    this.progressTracker = new ProgressTracker();
    this.repository = new FlowMetricsRepository();
  }

  async syncDealFlow(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    let syncStatusId: string | null = null;
    
    try {
      // Record sync start
      const syncStatusResult = await this.repository.recordSyncStatus({
        syncType: options.mode,
        startedAt: new Date(),
        status: 'running'
      });
      
      if (syncStatusResult.success && syncStatusResult.data) {
        syncStatusId = syncStatusResult.data.id;
      }

      this.progressTracker.start();
      
      // 1. Fetch deals based on mode
      const deals = await this.fetchDealsForSync(options);
      console.log(`📋 Found ${deals.length} deals to process`);
      
      // Update sync status with total deals
      if (syncStatusId) {
        await this.repository.updateSyncStatus(syncStatusId, {
          totalDeals: deals.length
        });
      }
      
      // 2. Process in batches with rate limiting
      const result = await this.processDealsBatched(deals, options, syncStatusId);
      
      // 3. Cleanup old data (if full sync)
      if (options.mode === 'full') {
        await this.cleanupOldData(options.daysBack || 365);
      }
      
      // 4. Update sync completion
      const duration = Date.now() - startTime;
      if (syncStatusId) {
        await this.repository.updateSyncStatus(syncStatusId, {
          completedAt: new Date(),
          status: 'completed',
          processedDeals: result.processedDeals,
          successfulDeals: result.successfulDeals,
          failedDeals: result.failedDeals,
          errors: result.errors,
          duration
        });
      }
      
      this.progressTracker.logCompletion(
        result.totalDeals,
        result.successfulDeals,
        result.failedDeals.length,
        duration
      );
      
      return {
        ...result,
        duration
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.progressTracker.logError(errorMessage);
      
      // Update sync status as failed
      if (syncStatusId) {
        await this.repository.updateSyncStatus(syncStatusId, {
          status: 'failed',
          errors: [errorMessage],
          duration: Date.now() - startTime
        });
      }
      
      throw new Error(`Sync failed: ${errorMessage}`);
    }
  }

  private async fetchDealsForSync(options: SyncOptions): Promise<any[]> {
    if (options.mode === 'full') {
      return await fetchAllDealsUpdatedSince(options.daysBack || 365);
    } else {
      const lastSyncResult = await this.repository.getLastSyncTimestamp();
      const lastSyncTime = lastSyncResult.success ? lastSyncResult.data : undefined;

      if (!lastSyncTime || lastSyncTime === 0) {
        // No previous sync, do a 7-day sync
        return await fetchAllDealsUpdatedSince(7);
      }

      const hoursSinceSync = (Date.now() - lastSyncTime) / (1000 * 60 * 60);
      const daysSinceSync = Math.ceil(hoursSinceSync / 24);

      return await fetchAllDealsUpdatedSince(Math.max(1, daysSinceSync));
    }
  }

  private async processDealsBatched(
    deals: any[], 
    options: SyncOptions,
    syncStatusId: string | null
  ): Promise<Omit<SyncResult, 'duration'>> {
    const batchSize = options.batchSize || 40;
    const batches = this.chunkArray(deals, batchSize);
    
    let processedDeals = 0;
    let successfulDeals = 0;
    const failedDeals: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      // Process batch with rate limiting
      await this.rateLimiter.waitForSlot();
      
      const batchPromises = batch.map(deal => 
        this.processSingleDeal(deal, options.maxRetries || 1)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Collect results
      batchResults.forEach((result, index) => {
        processedDeals++;
        if (result.status === 'fulfilled') {
          successfulDeals++;
        } else {
          const dealId = batch[index].id;
          failedDeals.push(dealId);
          errors.push(`Deal ${dealId}: ${result.reason}`);
        }
      });
      
      // Progress logging
      await this.progressTracker.logProgress(i + 1, batches.length, processedDeals, deals.length);
      
      // Update sync status periodically
      if (syncStatusId && (i + 1) % 10 === 0) {
        await this.repository.updateSyncStatus(syncStatusId, {
          processedDeals,
          successfulDeals
        });
      }
    }

    return {
      totalDeals: deals.length,
      processedDeals,
      successfulDeals,
      failedDeals,
      errors
    };
  }

  private async processSingleDeal(deal: any, maxRetries: number): Promise<{ success: boolean; dealId: number }> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Fetch flow data
        const flowData = await fetchDealFlow(deal.id);
        
        // Process and store
        const processedData = this.processFlowData(flowData, deal);
        const result = await this.repository.upsertDealFlowData(processedData);
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to store flow data');
        }
        
        return { success: true, dealId: deal.id };
        
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  private processFlowData(flowData: any[], deal: any): any[] {
    // Filter for stage changes only
    const stageChanges = flowData
      .filter((event) => event.object === 'dealChange' && event.data.field_key === 'stage_id')
      .map((event) => ({
        pipedriveEventId: event.data.id,
        dealId: event.data.item_id,
        pipelineId: deal.pipeline_id || 1, // Use deal's pipeline or default
        stageId: parseInt(event.data.new_value),
        stageName: event.data.additional_data?.new_value_formatted || `Stage ${event.data.new_value}`,
        enteredAt: new Date(event.timestamp),
      }))
      .sort((a, b) => a.enteredAt.getTime() - b.enteredAt.getTime());
    
    // Calculate durations and left_at times
    return stageChanges.map((event, index) => {
      const nextEvent = stageChanges[index + 1];
      const leftAt = nextEvent ? nextEvent.enteredAt : null;
      const durationSeconds = leftAt 
        ? Math.floor((leftAt.getTime() - event.enteredAt.getTime()) / 1000)
        : null;

      return {
        ...event,
        leftAt,
        durationSeconds
      };
    });
  }

  private async cleanupOldData(daysBack: number): Promise<void> {
    console.log(`🧹 Cleaning up flow data older than ${daysBack} days`);
    const result = await this.repository.cleanupOldFlowData(daysBack);
    
    if (result.success) {
      console.log(`✅ Cleaned up ${result.data} old records`);
    } else {
      console.warn(`⚠️ Failed to cleanup old data: ${result.error?.message}`);
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
