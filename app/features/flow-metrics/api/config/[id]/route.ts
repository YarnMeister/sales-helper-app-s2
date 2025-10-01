import { NextRequest, NextResponse } from 'next/server';
import { FlowMetricsRepository } from '@/lib/database/features/flow-metrics/repository';
import { logError, logInfo } from '@/lib/log';
import { ensureDatabaseInitialized } from '@/lib/database/init';

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

    // Transform camelCase to snake_case for UI compatibility
    const transformedConfig = {
      id: updatedConfig.id,
      metric_key: updatedConfig.metricKey,
      display_title: updatedConfig.displayTitle,
      config: updatedConfig.config,
      sort_order: updatedConfig.sortOrder,
      is_active: updatedConfig.isActive,
      created_at: updatedConfig.createdAt,
      updated_at: updatedConfig.updatedAt,
      // Extract threshold values from config for display
      avg_min_days: updatedConfig.config?.thresholds?.minDays,
      avg_max_days: updatedConfig.config?.thresholds?.maxDays,
      metric_comment: updatedConfig.config?.comment,
    };

    return NextResponse.json({
      success: true,
      data: transformedConfig
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
    const result = await repository.deleteAndReturn(params.id);
    
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

    if (!deletedConfig) {
      return NextResponse.json(
        { success: false, error: 'Flow metric configuration not found' },
        { status: 404 }
      );
    }

    // Transform camelCase to snake_case for UI compatibility
    const transformedConfig = {
      id: deletedConfig.id,
      metric_key: deletedConfig.metricKey,
      display_title: deletedConfig.displayTitle,
      config: deletedConfig.config,
      sort_order: deletedConfig.sortOrder,
      is_active: deletedConfig.isActive,
      created_at: deletedConfig.createdAt,
      updated_at: deletedConfig.updatedAt,
      // Extract threshold values from config for display
      avg_min_days: deletedConfig.config?.thresholds?.minDays,
      avg_max_days: deletedConfig.config?.thresholds?.maxDays,
      metric_comment: deletedConfig.config?.comment,
    };

    return NextResponse.json({
      success: true,
      data: transformedConfig
    });
  } catch (error) {
    logError('Error deleting flow metric configuration', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to delete flow metric configuration' },
      { status: 500 }
    );
  }
}
