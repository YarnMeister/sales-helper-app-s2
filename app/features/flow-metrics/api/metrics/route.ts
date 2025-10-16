import { NextRequest, NextResponse } from 'next/server';
import { getActiveFlowMetricsConfig, getDealsForMetric } from '@/lib/db';
import { logInfo, logError } from '@/lib/log';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    logInfo('GET /api/flow/metrics - Calculating flow metrics', { period });

    // Get all active metrics configuration
    const activeMetrics = await getActiveFlowMetricsConfig();

    logInfo('Active metrics fetched', {
      count: activeMetrics?.length || 0,
      metricKeys: activeMetrics?.map(m => m.metric_key) || []
    });

    if (!activeMetrics || activeMetrics.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No active metrics found'
      });
    }

    // Calculate metrics for each metric using metric_key
    const calculatedMetrics = await Promise.all(
      activeMetrics.map(async (metric) => {
        logInfo('Processing metric', { metricKey: metric.metric_key });
        try {
          // Get deals for this metric with period filtering
          const deals = await getDealsForMetric(metric.metric_key, period);

          // Extract thresholds from JSONB config
          const thresholds = metric.config?.thresholds || {};
          const metricComment = metric.config?.comment || '';

          if (!deals || deals.length === 0) {
            return {
              id: metric.id,
              title: metric.display_title,
              metricKey: metric.metric_key,
              mainMetric: '0',
              totalDeals: 0,
              avg_min_days: thresholds.minDays,
              avg_max_days: thresholds.maxDays,
              metric_comment: metricComment,
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
            metricKey: metric.metric_key,
            mainMetric: Math.round(average).toString(),
            totalDeals: deals.length,
            avg_min_days: thresholds.minDays,
            avg_max_days: thresholds.maxDays,
            metric_comment: metricComment,
          };
        } catch (error) {
          logError('Error calculating metrics for metric', {
            metricKey: metric.metric_key,
            metricId: metric.id,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });

          const thresholds = metric.config?.thresholds || {};
          const metricComment = metric.config?.comment || '';

          return {
            id: metric.id,
            title: metric.display_title,
            metricKey: metric.metric_key,
            mainMetric: 'N/A',
            totalDeals: 0,
            avg_min_days: thresholds.minDays,
            avg_max_days: thresholds.maxDays,
            metric_comment: metricComment,
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