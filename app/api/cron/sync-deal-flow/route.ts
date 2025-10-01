import { NextRequest, NextResponse } from 'next/server';
import { DealFlowSyncEngine } from '../shared/sync-engine';
import { verifyVercelCronAuth } from '../shared/auth';
import { logInfo, logError } from '@/lib/log';

/**
 * Full sync endpoint - runs daily at 2 AM UTC
 * Fetches flow data for all completed deals in the last 12 months
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    logInfo('🔄 Full sync cron job started', {
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
      mode: 'full',
      daysBack: 365, // 12 months
      batchSize: 40,
      maxRetries: 2
    });

    const duration = Date.now() - startTime;
    
    logInfo('✅ Full sync completed successfully', {
      duration,
      totalDeals: result.totalDeals,
      successfulDeals: result.successfulDeals,
      failedDeals: result.failedDeals.length,
      successRate: result.totalDeals > 0 ? (result.successfulDeals / result.totalDeals * 100).toFixed(1) : '0'
    });

    return NextResponse.json({
      success: true,
      message: 'Full sync completed successfully',
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
    
    logError('❌ Full sync failed', {
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
 * Manual trigger endpoint for testing
 * Allows triggering full sync manually with custom parameters
 */
export async function POST(request: NextRequest) {
  try {
    // For manual triggers, we might want different auth
    // For now, use the same cron auth
    if (!verifyVercelCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { daysBack = 30, batchSize = 20 } = body;

    logInfo('🔄 Manual full sync triggered', {
      daysBack,
      batchSize,
      triggeredBy: 'manual'
    });

    const syncEngine = new DealFlowSyncEngine();
    
    const result = await syncEngine.syncDealFlow({
      mode: 'full',
      daysBack: Math.min(daysBack, 365), // Cap at 1 year
      batchSize: Math.min(batchSize, 40), // Cap at rate limit
      maxRetries: 1
    });

    return NextResponse.json({
      success: true,
      message: 'Manual full sync completed',
      result
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logError('❌ Manual full sync failed', {
      error: errorMessage
    });

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
