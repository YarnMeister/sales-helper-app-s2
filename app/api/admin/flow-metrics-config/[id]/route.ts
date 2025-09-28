import { NextRequest, NextResponse } from 'next/server';
import { updateFlowMetricConfig, deleteFlowMetricConfig } from '../../../../../lib/db';
import { logError, logInfo } from '../../../../../lib/log';
import { ensureDatabaseInitialized } from '../../../../../lib/database/init';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Ensure repository system is initialized
  ensureDatabaseInitialized();

  try {
    const body = await request.json();
    logInfo('PATCH /api/admin/flow-metrics-config/[id] - Updating flow metric configuration', { id: params.id, body });
    
    const updatedConfig = await updateFlowMetricConfig(params.id, {
      display_title: body.display_title,
      canonical_stage: body.canonical_stage,
      sort_order: body.sort_order,
      is_active: body.is_active,
      start_stage_id: body.start_stage_id ? Number(body.start_stage_id) : undefined,
      end_stage_id: body.end_stage_id ? Number(body.end_stage_id) : undefined,
      avg_min_days: body.avg_min_days !== undefined ? Number(body.avg_min_days) : undefined,
      avg_max_days: body.avg_max_days !== undefined ? Number(body.avg_max_days) : undefined,
      metric_comment: body.metric_comment
    });
    
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
    logError('Error updating flow metric configuration', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to update flow metric configuration' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Ensure repository system is initialized
  ensureDatabaseInitialized();

  try {
    logInfo('DELETE /api/admin/flow-metrics-config/[id] - Deleting flow metric configuration', { id: params.id });
    
    const deletedConfig = await deleteFlowMetricConfig(params.id);
    
    if (!deletedConfig) {
      return NextResponse.json(
        { success: false, error: 'Flow metric configuration not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: deletedConfig
    });
  } catch (error) {
    logError('Error deleting flow metric configuration', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to delete flow metric configuration' },
      { status: 500 }
    );
  }
}
