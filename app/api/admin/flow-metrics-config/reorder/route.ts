import { NextRequest, NextResponse } from 'next/server';
import { reorderFlowMetrics } from '../../../../../lib/db';
import { logError, logInfo } from '../../../../../lib/log';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logInfo('POST /api/admin/flow-metrics-config/reorder - Reordering flow metrics', body);
    
    const { reorderData } = body;
    
    if (!Array.isArray(reorderData) || reorderData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'reorderData must be a non-empty array' },
        { status: 400 }
      );
    }
    
    // Validate each item has required fields
    for (const item of reorderData) {
      if (!item.id || typeof item.sort_order !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Each item must have id and sort_order fields' },
          { status: 400 }
        );
      }
    }
    
    const result = await reorderFlowMetrics(reorderData);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    logError('Error reordering flow metrics', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to reorder flow metrics' },
      { status: 500 }
    );
  }
}
