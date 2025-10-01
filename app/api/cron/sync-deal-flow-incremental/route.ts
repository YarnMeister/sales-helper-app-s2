import { NextRequest, NextResponse } from 'next/server';
import { DealFlowSyncEngine } from '../shared/sync-engine';
import { verifyVercelCronAuth } from '../shared/auth';
import { logInfo, logError } from '@/lib/log';

/**
 * Incremental sync endpoint - runs every 6 hours
 * Fetches flow data for deals updated since last sync
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    logInfo('🔄 Incremental sync cron job started', {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      source: 'vercel-cron'
    });

    // Verify this is a legitimate Vercel cron request
    if (!verifyVercelCronAuth(request)) {
      logError('❌ Unauthorized cron request', {
        headers: Object.fromEntries(request.headers.entries()),
        ip: request.ip
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const syncEngine = new DealFlowSyncEngine();
    
    const result = await syncEngine.syncDealFlow({
      mode: 'incremental',
      batchSize: 20, // Smaller batches for incremental
      maxRetries: 1
    });

    const duration = Date.now() - startTime;
    
    logInfo('✅ Incremental sync completed successfully', {
      duration,
      totalDeals: result.totalDeals,
      successfulDeals: result.successfulDeals,
      failedDeals: result.failedDeals.length,
      successRate: result.totalDeals > 0 ? (result.successfulDeals / result.totalDeals * 100).toFixed(1) : '0'
    });

    return NextResponse.json({
      success: true,
      message: 'Incremental sync completed successfully',
      result: {
        totalDeals: result.totalDeals,
        processedDeals: result.processedDeals,
        successfulDeals: result.successfulDeals,
        failedDeals: result.failedDeals.length,
        duration: result.duration,
        successRate: result.totalDeals > 0 ? (result.successfulDeals / result.totalDeals * 100).toFixed(1) + '%' : '0%'
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logError('❌ Incremental sync failed', {
      error: errorMessage,
      duration,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: errorMessage,
      duration
    }, { status: 500 });
  }
}

/**
 * Manual trigger endpoint for testing incremental sync
 */
export async function POST(request: NextRequest) {
  try {
    if (!verifyVercelCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { batchSize = 10 } = body;

    logInfo('🔄 Manual incremental sync triggered', {
      batchSize,
      triggeredBy: 'manual'
    });

    const syncEngine = new DealFlowSyncEngine();
    
    const result = await syncEngine.syncDealFlow({
      mode: 'incremental',
      batchSize: Math.min(batchSize, 20), // Cap at smaller size for incremental
      maxRetries: 1
    });

    return NextResponse.json({
      success: true,
      message: 'Manual incremental sync completed',
      result
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logError('❌ Manual incremental sync failed', {
      error: errorMessage
    });

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
