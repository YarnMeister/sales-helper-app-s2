import { NextRequest, NextResponse } from 'next/server';
import { updateFlowMetricComment } from '../../../../../../lib/db';
import { logError, logInfo } from '../../../../../../lib/log';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    logInfo('PATCH /api/admin/flow-metrics-config/[id]/comment - Updating metric comment', { id: params.id, commentLength: body.comment?.length });
    
    if (typeof body.comment !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Comment must be a string' },
        { status: 400 }
      );
    }
    
    const updatedConfig = await updateFlowMetricComment(params.id, body.comment);
    
    if (!updatedConfig) {
      return NextResponse.json(
        { success: false, error: 'Flow metric configuration not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedConfig
    });
  } catch (error) {
    logError('Error updating metric comment', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to update metric comment' },
      { status: 500 }
    );
  }
}
