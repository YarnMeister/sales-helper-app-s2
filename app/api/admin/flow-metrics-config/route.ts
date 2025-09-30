import { NextRequest, NextResponse } from 'next/server';
import { getFlowMetricsConfig, createFlowMetricConfig } from '../../../../lib/db';
import { logError, logInfo } from '../../../../lib/log';
import { ensureDatabaseInitialized } from '../../../../lib/database/init';

export async function GET() {
  // Ensure repository system is initialized
  ensureDatabaseInitialized();

  try {
    logInfo('GET /api/admin/flow-metrics-config - Fetching flow metrics configuration');
    
    const config = await getFlowMetricsConfig();
    
    return NextResponse.json({
      success: true,
      data: config
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
    
    const newConfig = await createFlowMetricConfig({
      metric_key,
      display_title,
      canonical_stage: config?.startStage?.name || 'default', // Legacy field - use start stage name
      config: config, // Store JSONB config
      sort_order: sort_order || 0,
      is_active: is_active !== false,
      start_stage_id: config?.startStage?.id,
      end_stage_id: config?.endStage?.id,
      avg_min_days: config?.thresholds?.minDays,
      avg_max_days: config?.thresholds?.maxDays,
      metric_comment: config?.comment || undefined
    });
    
    return NextResponse.json({
      success: true,
      data: newConfig
    });
  } catch (error) {
    logError('Error creating flow metric configuration', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to create flow metric configuration' },
      { status: 500 }
    );
  }
}