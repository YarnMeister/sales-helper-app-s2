import { NextRequest, NextResponse } from 'next/server';
import { FlowMetricsRepository, CanonicalStageMappingsRepository } from '../../../../lib/database';
import { logError, logInfo } from '../../../../lib/log';

export async function GET() {
  try {
    logInfo('GET /api/admin/flow-metrics-config - Fetching flow metrics configuration');
    
    const repository = new CanonicalStageMappingsRepository();
    const result = await repository.getMappingsWithConfig();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return NextResponse.json({
      success: true,
      data: result.data
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
  try {
    const body = await request.json();
    logInfo('POST /api/admin/flow-metrics-config - Creating flow metric configuration', body);
    
    // Validate required fields
    const { metric_key, display_title, canonical_stage, start_stage_id, end_stage_id, avg_min_days, avg_max_days, metric_comment } = body;
    
    if (!metric_key || !display_title || !canonical_stage) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: metric_key, display_title, canonical_stage' },
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
    
    // Validate stage IDs are numbers
    if (start_stage_id && !Number.isInteger(Number(start_stage_id))) {
      return NextResponse.json(
        { success: false, error: 'start_stage_id must be a valid number' },
        { status: 400 }
      );
    }
    
    if (end_stage_id && !Number.isInteger(Number(end_stage_id))) {
      return NextResponse.json(
        { success: false, error: 'end_stage_id must be a valid number' },
        { status: 400 }
      );
    }
    
    // Validate threshold values
    if (avg_min_days !== undefined && !Number.isInteger(Number(avg_min_days))) {
      return NextResponse.json(
        { success: false, error: 'avg_min_days must be a valid number' },
        { status: 400 }
      );
    }
    
    if (avg_max_days !== undefined && !Number.isInteger(Number(avg_max_days))) {
      return NextResponse.json(
        { success: false, error: 'avg_max_days must be a valid number' },
        { status: 400 }
      );
    }
    
    // Validate threshold logic
    if (avg_min_days !== undefined && avg_max_days !== undefined && Number(avg_min_days) > Number(avg_max_days)) {
      return NextResponse.json(
        { success: false, error: 'avg_min_days cannot be greater than avg_max_days' },
        { status: 400 }
      );
    }
    
    const metricsRepository = new FlowMetricsRepository();
    const mappingsRepository = new CanonicalStageMappingsRepository();
    
    // Create the metric config first
    const metricResult = await metricsRepository.create({
      metricKey: metric_key,
      displayTitle: display_title,
      canonicalStage: canonical_stage,
      sortOrder: body.sort_order || 0,
      isActive: body.is_active !== false,
    });
    
    if (!metricResult.success || !metricResult.data) {
      throw new Error('Failed to create metric config');
    }
    
    // Create the stage mapping if stage IDs are provided
    if (start_stage_id && end_stage_id) {
      const mappingResult = await mappingsRepository.create({
        metricConfigId: metricResult.data.id,
        canonicalStage: canonical_stage,
        startStageId: Number(start_stage_id),
        endStageId: Number(end_stage_id),
        avgMinDays: avg_min_days !== undefined ? Number(avg_min_days) : undefined,
        avgMaxDays: avg_max_days !== undefined ? Number(avg_max_days) : undefined,
        metricComment: metric_comment || undefined,
      });
      
      if (!mappingResult.success) {
        throw new Error('Failed to create stage mapping');
      }
    }
    
    // Return the created config with mapping data
    const newConfig = await metricsRepository.findById(metricResult.data.id);
    if (!newConfig.success || !newConfig.data) {
      throw new Error('Failed to retrieve created config');
    }
    
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
