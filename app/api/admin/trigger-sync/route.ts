import { NextRequest, NextResponse } from 'next/server';
import { DealFlowSyncEngine } from '../../cron/shared/sync-engine';
import { FlowMetricsRepository } from '@/lib/database/features/flow-metrics/repository';
import { logInfo, logError } from '@/lib/log';

/**
 * Manual sync trigger endpoint for admin use
 * Allows triggering sync operations manually with custom parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      mode = 'incremental', 
      daysBack = 7, 
      batchSize = 20,
      async: asyncMode = true 
    } = body;

    // Validate parameters
    if (!['full', 'incremental'].includes(mode)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid mode. Must be "full" or "incremental"'
      }, { status: 400 });
    }

    if (daysBack < 1 || daysBack > 365) {
      return NextResponse.json({
        success: false,
        error: 'daysBack must be between 1 and 365'
      }, { status: 400 });
    }

    if (batchSize < 1 || batchSize > 40) {
      return NextResponse.json({
        success: false,
        error: 'batchSize must be between 1 and 40'
      }, { status: 400 });
    }

    // Check if sync is already running
    const repository = new FlowMetricsRepository();
    const recentSyncsResult = await repository.getRecentSyncHistory(1);
    
    if (recentSyncsResult.success && recentSyncsResult.data) {
      const latestSync = recentSyncsResult.data[0];
      if (latestSync && latestSync.status === 'running') {
        return NextResponse.json({
          success: false,
          error: 'A sync operation is already running. Please wait for it to complete.'
        }, { status: 409 });
      }
    }

    logInfo('🔄 Manual sync triggered', {
      mode,
      daysBack,
      batchSize,
      async: asyncMode,
      triggeredBy: 'admin',
      timestamp: new Date().toISOString()
    });

    const syncEngine = new DealFlowSyncEngine();

    if (asyncMode) {
      // Start sync in background and return immediately
      syncEngine.syncDealFlow({
        mode: mode as 'full' | 'incremental',
        daysBack,
        batchSize,
        maxRetries: 2
      }).catch(error => {
        logError('❌ Background sync failed', {
          error: error instanceof Error ? error.message : String(error),
          mode,
          daysBack,
          batchSize
        });
      });

      return NextResponse.json({
        success: true,
        message: `${mode} sync started in background`,
        parameters: {
          mode,
          daysBack,
          batchSize
        }
      });

    } else {
      // Wait for sync to complete
      const result = await syncEngine.syncDealFlow({
        mode: mode as 'full' | 'incremental',
        daysBack,
        batchSize,
        maxRetries: 2
      });

      return NextResponse.json({
        success: true,
        message: `${mode} sync completed successfully`,
        result: {
          totalDeals: result.totalDeals,
          processedDeals: result.processedDeals,
          successfulDeals: result.successfulDeals,
          failedDeals: result.failedDeals.length,
          duration: result.duration,
          successRate: result.totalDeals > 0 
            ? (result.successfulDeals / result.totalDeals * 100).toFixed(1) + '%' 
            : '0%'
        }
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logError('❌ Manual sync trigger failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

/**
 * Get available sync options and current status
 */
export async function GET(request: NextRequest) {
  try {
    const repository = new FlowMetricsRepository();
    
    // Get current sync status
    const recentSyncsResult = await repository.getRecentSyncHistory(1);
    const latestSync = recentSyncsResult.success && recentSyncsResult.data 
      ? recentSyncsResult.data[0] 
      : null;

    // Get data stats for recommendations
    const dataStatsResult = await repository.getFlowDataStats();
    const dataStats = dataStatsResult.success ? dataStatsResult.data : null;

    // Calculate recommended parameters
    const lastSyncTime = latestSync?.completedAt;
    const hoursSinceLastSync = lastSyncTime 
      ? Math.floor((Date.now() - lastSyncTime.getTime()) / (1000 * 60 * 60))
      : null;

    const recommendedDaysBack = hoursSinceLastSync 
      ? Math.min(Math.max(Math.ceil(hoursSinceLastSync / 24), 1), 30)
      : 7;

    return NextResponse.json({
      success: true,
      data: {
        currentStatus: {
          isRunning: latestSync?.status === 'running',
          lastSync: lastSyncTime,
          hoursSinceLastSync
        },
        
        options: {
          modes: [
            {
              value: 'incremental',
              label: 'Incremental Sync',
              description: 'Sync deals updated since last sync',
              recommended: true
            },
            {
              value: 'full',
              label: 'Full Sync',
              description: 'Sync all deals in specified time range',
              recommended: false
            }
          ],
          
          daysBackOptions: [
            { value: 1, label: '1 day' },
            { value: 7, label: '1 week', recommended: hoursSinceLastSync && hoursSinceLastSync < 168 },
            { value: 30, label: '1 month', recommended: hoursSinceLastSync && hoursSinceLastSync >= 168 },
            { value: 90, label: '3 months' },
            { value: 365, label: '1 year' }
          ],
          
          batchSizeOptions: [
            { value: 10, label: 'Small (10)', description: 'Slower but more reliable' },
            { value: 20, label: 'Medium (20)', description: 'Balanced speed and reliability', recommended: true },
            { value: 40, label: 'Large (40)', description: 'Faster but may hit rate limits' }
          ]
        },
        
        recommendations: {
          mode: 'incremental',
          daysBack: recommendedDaysBack,
          batchSize: 20,
          reasoning: hoursSinceLastSync 
            ? `Based on ${hoursSinceLastSync} hours since last sync`
            : 'Default recommendation for first sync'
        },
        
        dataStats: {
          totalRecords: dataStats?.totalRecords || 0,
          oldestRecord: dataStats?.oldestRecord,
          newestRecord: dataStats?.newestRecord
        }
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logError('❌ Failed to get sync options', {
      error: errorMessage
    });

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
