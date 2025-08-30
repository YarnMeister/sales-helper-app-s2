import { NextRequest, NextResponse } from 'next/server';
import { getActiveFlowMetricsConfig, getDealsForCanonicalStage } from '../../../../lib/db';
import { logInfo, logError } from '../../../../lib/log';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    logInfo('GET /api/flow/metrics - Calculating flow metrics', { period });

    // Get all active metrics configuration
    const activeMetrics = await getActiveFlowMetricsConfig();
    
    if (!activeMetrics || activeMetrics.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No active metrics found'
      });
    }

    // Calculate metrics for each canonical stage
    const calculatedMetrics = await Promise.all(
      activeMetrics.map(async (metric) => {
        try {
          // Get deals for this canonical stage with period filtering
          const deals = await getDealsForCanonicalStage(metric.canonical_stage, period);
          
          if (!deals || deals.length === 0) {
            return {
              id: metric.id,
              title: metric.display_title,
              canonicalStage: metric.canonical_stage,
              mainMetric: '0',
              totalDeals: 0,
              avg_min_days: metric.avg_min_days,
              avg_max_days: metric.avg_max_days,
              metric_comment: metric.metric_comment,
            };
          }

          // Calculate metrics using the same logic as the detail page
          const durationsInDays = deals.map(deal => 
            Math.round((deal.duration_seconds / 86400) * 100) / 100
          );

          const totalDays = durationsInDays.reduce((sum, days) => sum + days, 0);
          const average = Math.round((totalDays / durationsInDays.length) * 100) / 100;
          const best = Math.min(...durationsInDays);
          const worst = Math.max(...durationsInDays);

          return {
            id: metric.id,
            title: metric.display_title,
            canonicalStage: metric.canonical_stage,
            mainMetric: Math.round(average).toString(),
            totalDeals: deals.length,
            avg_min_days: metric.avg_min_days,
            avg_max_days: metric.avg_max_days,
            metric_comment: metric.metric_comment,
          };
        } catch (error) {
          logError('Error calculating metrics for canonical stage', {
            canonicalStage: metric.canonical_stage,
            error: error instanceof Error ? error.message : String(error)
          });
          
          return {
            id: metric.id,
            title: metric.display_title,
            canonicalStage: metric.canonical_stage,
            mainMetric: 'N/A',
            totalDeals: 0,
            avg_min_days: metric.avg_min_days,
            avg_max_days: metric.avg_max_days,
            metric_comment: metric.metric_comment,
          };
        }
      })
    );

    logInfo('Successfully calculated flow metrics', {
      period,
      metricCount: calculatedMetrics.length
    });

    return NextResponse.json({
      success: true,
      data: calculatedMetrics,
      message: 'Successfully calculated flow metrics'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Error calculating flow metrics', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate flow metrics',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
