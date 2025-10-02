import { NextRequest, NextResponse } from 'next/server';
import { FlowMetricsRepository } from '@/lib/database/features/flow-metrics/repository';
import { logInfo, logError } from '@/lib/log';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * Get sync status and data statistics
 * Provides overview of sync operations and data health
 */
export async function GET(request: NextRequest) {
  try {
    logInfo('📊 Sync status requested', {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')
    });

    const repository = new FlowMetricsRepository();
    
    // Get recent sync history
    const recentSyncsResult = await repository.getRecentSyncHistory(10);
    if (!recentSyncsResult.success) {
      throw new Error(recentSyncsResult.error?.message || 'Failed to get sync history');
    }
    
    // Get data statistics
    const dataStatsResult = await repository.getFlowDataStats();
    if (!dataStatsResult.success) {
      throw new Error(dataStatsResult.error?.message || 'Failed to get data stats');
    }
    
    const recentSyncs = recentSyncsResult.data || [];
    const dataStats = dataStatsResult.data;
    
    // Calculate additional metrics
    const lastSync = recentSyncs.find(sync => sync.status === 'completed');
    const runningSync = recentSyncs.find(sync => sync.status === 'running');
    const failedSyncs = recentSyncs.filter(sync => sync.status === 'failed').length;
    const successfulSyncs = recentSyncs.filter(sync => sync.status === 'completed').length;
    
    // Calculate success rate
    const totalSyncs = recentSyncs.length;
    const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs * 100).toFixed(1) : '0';
    
    // Calculate data freshness
    const now = new Date();
    const lastSyncTime = lastSync?.completedAt;
    const dataAge = lastSyncTime ? Math.floor((now.getTime() - lastSyncTime.getTime()) / (1000 * 60 * 60)) : null;
    
    const response = {
      success: true,
      data: {
        // Current status
        currentStatus: {
          isRunning: !!runningSync,
          lastSyncTime: lastSyncTime,
          dataAge: dataAge ? `${dataAge} hours ago` : 'Never',
          nextScheduledSync: getNextScheduledSync()
        },
        
        // Recent sync history
        recentSyncs: recentSyncs.map(sync => ({
          id: sync.id,
          type: sync.syncType,
          status: sync.status,
          startedAt: sync.startedAt,
          completedAt: sync.completedAt,
          duration: sync.duration ? formatDuration(sync.duration) : null,
          totalDeals: sync.totalDeals,
          successfulDeals: sync.successfulDeals,
          failedDeals: Array.isArray(sync.failedDeals) ? sync.failedDeals.length : 0,
          successRate: sync.totalDeals && sync.successfulDeals 
            ? (sync.successfulDeals / sync.totalDeals * 100).toFixed(1) + '%' 
            : '0%'
        })),
        
        // Data statistics
        dataStats: {
          totalRecords: dataStats?.totalRecords || 0,
          oldestRecord: dataStats?.oldestRecord,
          newestRecord: dataStats?.newestRecord,
          dataSpan: dataStats?.oldestRecord && dataStats?.newestRecord 
            ? calculateDataSpan(dataStats.oldestRecord, dataStats.newestRecord)
            : null
        },
        
        // Performance metrics
        performance: {
          successRate: successRate + '%',
          failedSyncs,
          successfulSyncs,
          totalSyncs,
          averageDuration: calculateAverageDuration(recentSyncs)
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logError('❌ Failed to get sync status', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

function getNextScheduledSync(): string {
  const now = new Date();
  const next2AM = new Date(now);
  next2AM.setUTCHours(2, 0, 0, 0);
  
  // If it's past 2 AM today, schedule for tomorrow
  if (now.getUTCHours() >= 2) {
    next2AM.setUTCDate(next2AM.getUTCDate() + 1);
  }
  
  return next2AM.toISOString();
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function calculateDataSpan(oldest: Date, newest: Date): string {
  const diffMs = newest.getTime() - oldest.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays > 365) {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''}`;
  } else if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }
}

function calculateAverageDuration(syncs: any[]): string {
  const completedSyncs = syncs.filter(sync => sync.status === 'completed' && sync.duration);
  
  if (completedSyncs.length === 0) {
    return 'N/A';
  }
  
  const totalDuration = completedSyncs.reduce((sum, sync) => sum + (sync.duration || 0), 0);
  const averageDuration = totalDuration / completedSyncs.length;
  
  return formatDuration(averageDuration);
}
