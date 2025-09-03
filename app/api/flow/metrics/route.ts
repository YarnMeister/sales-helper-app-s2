import { NextRequest, NextResponse } from 'next/server';
// import { FlowMetricsRepository } from '../../../../lib/database';
import { logInfo, logError } from '../../../../lib/log';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Temporary placeholder - will restore after fixing module resolution
    return NextResponse.json({ success: true, data: [], message: 'Temporarily disabled for module resolution fix' });
    
    // const repository = new FlowMetricsRepository();
    
    // // Get active metrics
    // const activeMetricsResult = await repository.findActive();
    // if (!activeMetricsResult.success) {
    //   logError('Failed to get active metrics', activeMetricsResult.error);
    //   return NextResponse.json(
    //     { success: false, error: 'Failed to get active metrics' },
    //     { status: 500 }
    //   );
    // }
    
    // const activeMetrics = activeMetricsResult.data;
    // if (activeMetrics.length === 0) {
    //   return NextResponse.json({
    //     success: true,
    //     data: [],
    //     message: 'No active metrics found. Add metrics in the Mappings tab.'
    //   });
    // }
    
    // // Calculate metrics for each active metric
    // const calculatedMetrics = await Promise.all(
    //   activeMetrics.map(async (metric: any) => {
    //     try {
    //       // Get deals for the last 7 days for this canonical stage
    //       const dealsResult = await repository.getDealsForCanonicalStage(metric.canonicalStage, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date());
    //       const deals = dealsResult.success ? dealsResult.data : [];
    //       
    //       // Calculate average time
    //       let totalTime = 0;
    //       let validDeals = 0;
    //       
    //       deals.forEach((deal: any) => {
    //         if (deal.startDate && deal.endDate) {
    //           const startDate = new Date(deal.startDate);
    //           const endDate = new Date(deal.endDate);
    //           const timeDiff = endDate.getTime() - startDate.getTime();
    //           const daysDiff = timeDiff / (1000 * 3600 * 24);
    //           
    //           if (daysDiff > 0) {
    //             totalTime += daysDiff;
    //             validDeals++;
    //           }
    //         }
    //       });
    //       
    //       const averageTime = validDeals > 0 ? Math.round(totalTime / validDeals) : 0;
    //       
    //       return {
    //         id: metric.id,
    //         metricKey: metric.metricKey,
    //         displayTitle: metric.displayTitle,
    //         canonicalStage: metric.canonicalStage,
    //         sortOrder: metric.sortOrder,
    //         isActive: metric.isActive,
    //         dealCount: deals.length,
    //         averageTime,
    //         lastUpdated: new Date().toISOString()
    //       };
    //     } catch (error) {
    //       logError(`Error calculating metric for ${metric.canonicalStage}`, error);
    //       return {
    //         id: metric.id,
    //         metricKey: metric.metricKey,
    //         displayTitle: metric.displayTitle,
    //         canonicalStage: metric.canonicalStage,
    //         sortOrder: metric.sortOrder,
    //         isActive: metric.isActive,
    //         dealCount: 0,
    //         averageTime: 0,
    //         error: 'Failed to calculate metric'
    //       };
    //     }
    //   })
    // );
    
    // logInfo('Successfully calculated flow metrics', { count: calculatedMetrics.length });
    // return NextResponse.json({
    //   success: true,
    //   data: calculatedMetrics
    // });
  } catch (error) {
    logError('Unexpected error in GET flow metrics', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
