import { NextRequest, NextResponse } from 'next/server';
import { getFlowMetricConfig, updateFlowMetricConfig } from '@/lib/db';
import { logError, logInfo } from '@/lib/log';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    logInfo('PATCH /api/flow/config/[id]/comment - Updating metric comment', { id: params.id, commentLength: body.comment?.length });

    if (typeof body.comment !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Comment must be a string' },
        { status: 400 }
      );
    }

    // Get current config
    const currentConfig = await getFlowMetricConfig(params.id);

    if (!currentConfig) {
      return NextResponse.json(
        { success: false, error: 'Flow metric configuration not found' },
        { status: 404 }
      );
    }

    // Update config with new comment in JSONB
    const updatedConfigData = {
      ...currentConfig.config,
      comment: body.comment
    };

    const updatedConfig = await updateFlowMetricConfig(params.id, {
      config: updatedConfigData
    });

    if (!updatedConfig) {
      return NextResponse.json(
        { success: false, error: 'Failed to update metric comment' },
        { status: 500 }
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
