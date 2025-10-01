import { NextRequest, NextResponse } from 'next/server';
import { FlowMetricsRepository } from '../../../../../lib/database/repositories/flow-metrics-repository';
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
    
    const repository = new FlowMetricsRepository();
    const result = await repository.update(params.id, {
      displayTitle: body.display_title,
      config: body.config, // JSONB config object
      sortOrder: body.sort_order,
      isActive: body.is_active,
    });
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update metric');
    }
    
    const updatedConfig = result.data;
    
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
    
    const repository = new FlowMetricsRepository();
    const result = await repository.delete(params.id);
    
    if (!result.success) {
      if (result.error?.code === 'not_found') {
        return NextResponse.json(
          { success: false, error: 'Flow metric configuration not found' },
          { status: 404 }
        );
      }
      throw new Error(result.error?.message || 'Failed to delete metric');
    }
    
    const deletedConfig = result.data;
    
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
