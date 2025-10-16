import { NextRequest, NextResponse } from 'next/server';
import { FlowMetricsRepository } from '@/lib/database/features/flow-metrics/repository';
import { logError, logInfo } from '@/lib/log';
import { ensureDatabaseInitialized } from '@/lib/database/init';

export async function GET(request: NextRequest) {
  // Ensure repository system is initialized
  ensureDatabaseInitialized();

  try {
    const { searchParams } = new URL(request.url);
    const metricKey = searchParams.get('metric_key');

    // If metric_key is provided, fetch single metric
    if (metricKey) {
      logInfo('GET /api/flow/config - Fetching single metric configuration', { metricKey });

      const repository = new FlowMetricsRepository();
      const result = await repository.getByKey(metricKey);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch metric');
      }

      if (!result.data) {
        return NextResponse.json(
          { success: false, error: 'Metric not found' },
          { status: 404 }
        );
      }

      // Transform camelCase to snake_case for UI compatibility
      const transformedData = {
        id: result.data.id,
        metric_key: result.data.metricKey,
        display_title: result.data.displayTitle,
        config: result.data.config,
        sort_order: result.data.sortOrder,
        is_active: result.data.isActive,
        created_at: result.data.createdAt,
        updated_at: result.data.updatedAt,
        // Extract threshold values from config for display
        avg_min_days: result.data.config?.thresholds?.minDays,
        avg_max_days: result.data.config?.thresholds?.maxDays,
        metric_comment: result.data.config?.comment,
      };

      return NextResponse.json({
        success: true,
        data: transformedData
      });
    }

    // Otherwise, fetch all metrics
    logInfo('GET /api/flow/config - Fetching all flow metrics configuration');

    const repository = new FlowMetricsRepository();
    const result = await repository.findAll();

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch metrics');
    }

    // Transform camelCase to snake_case for UI compatibility
    const transformedData = result.data?.map((metric: any) => ({
      id: metric.id,
      metric_key: metric.metricKey,
      display_title: metric.displayTitle,
      config: metric.config,
      sort_order: metric.sortOrder,
      is_active: metric.isActive,
      created_at: metric.createdAt,
      updated_at: metric.updatedAt,
      // Extract threshold values from config for display
      avg_min_days: metric.config?.thresholds?.minDays,
      avg_max_days: metric.config?.thresholds?.maxDays,
      metric_comment: metric.config?.comment,
    }));

    return NextResponse.json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    logError('Error fetching flow metrics configuration', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flow metrics configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Ensure repository system is initialized
  ensureDatabaseInitialized();

  try {
    const body = await request.json();
    logInfo('POST /api/admin/flow-metrics-config - Creating flow metric configuration', body);
    
    const { metric_key, display_title, config, sort_order, is_active } = body;
    
    // Validate required fields
    if (!metric_key || !display_title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: metric_key, display_title' },
        { status: 400 }
      );
    }
    
    // Validate metric_key format (kebab-case)
    if (!/^[a-z0-9-]+$/.test(metric_key)) {
      return NextResponse.json(
        { success: false, error: 'metric_key must be in kebab-case format (e.g., lead-conversion)' },
        { status: 400 }
      );
    }
    
    // Validate config structure (JSONB)
    if (config) {
      if (!config.startStage || !config.endStage) {
        return NextResponse.json(
          { success: false, error: 'config must include startStage and endStage' },
          { status: 400 }
        );
      }
      
      // Validate stage structure
      if (!config.startStage.id || !config.startStage.name || !config.startStage.pipelineId || !config.startStage.pipelineName) {
        return NextResponse.json(
          { success: false, error: 'startStage must include id, name, pipelineId, and pipelineName' },
          { status: 400 }
        );
      }
      
      if (!config.endStage.id || !config.endStage.name || !config.endStage.pipelineId || !config.endStage.pipelineName) {
        return NextResponse.json(
          { success: false, error: 'endStage must include id, name, pipelineId, and pipelineName' },
          { status: 400 }
        );
      }
      
      // Validate same stage
      if (config.startStage.id === config.endStage.id) {
        return NextResponse.json(
          { success: false, error: 'Start and end stages cannot be the same' },
          { status: 400 }
        );
      }
      
      // Validate thresholds if provided
      if (config.thresholds) {
        if (config.thresholds.minDays !== undefined && config.thresholds.maxDays !== undefined) {
          if (config.thresholds.minDays > config.thresholds.maxDays) {
            return NextResponse.json(
              { success: false, error: 'minDays cannot be greater than maxDays' },
              { status: 400 }
            );
          }
        }
      }
    }
    
    const repository = new FlowMetricsRepository();
    const result = await repository.create({
      metricKey: metric_key,
      displayTitle: display_title,
      config: config, // Store JSONB config with cross-pipeline support
      sortOrder: sort_order || 0,
      isActive: is_active !== false
    });

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create metric');
    }

    const newConfig = result.data;

    if (!newConfig) {
      throw new Error('Failed to create metric - no data returned');
    }

    // Transform camelCase to snake_case for UI compatibility
    const transformedConfig = {
      id: newConfig.id,
      metric_key: newConfig.metricKey,
      display_title: newConfig.displayTitle,
      config: newConfig.config,
      sort_order: newConfig.sortOrder,
      is_active: newConfig.isActive,
      created_at: newConfig.createdAt,
      updated_at: newConfig.updatedAt,
      // Extract threshold values from config for display
      avg_min_days: newConfig.config?.thresholds?.minDays,
      avg_max_days: newConfig.config?.thresholds?.maxDays,
      metric_comment: newConfig.config?.comment,
    };

    return NextResponse.json({
      success: true,
      data: transformedConfig
    });
  } catch (error) {
    logError('Error creating flow metric configuration', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to create flow metric configuration' },
      { status: 500 }
    );
  }
}