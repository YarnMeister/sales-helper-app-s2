import { NextRequest, NextResponse } from 'next/server';
import { FlowMetricsRepository, CanonicalStageMappingsRepository } from '../../../../lib/database/repositories/flow-metrics-repository';
import { logError, logInfo } from '../../../../lib/log';

export async function GET() {
  try {
    const repository = new FlowMetricsRepository();
    
    const result = await repository.findAll();
    if (!result.success) {
      logError('Failed to get flow metrics config', { error: result.error });
      return NextResponse.json(
        { success: false, error: 'Failed to get flow metrics config' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    logError('Unexpected error in GET flow-metrics-config', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const repository = new FlowMetricsRepository();
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
    
    // Validate threshold values if provided
    if (avg_min_days !== undefined && avg_max_days !== undefined && avg_min_days > avg_max_days) {
      return NextResponse.json(
        { success: false, error: 'avg_min_days cannot be greater than avg_max_days' },
        { status: 400 }
      );
    }
    
    const result = await repository.create({
      metricKey: metric_key,
      displayTitle: display_title,
      canonicalStage: canonical_stage,
      isActive: true,
      sortOrder: 0
    });
    if (!result.success) {
      logError('Failed to create flow metrics config', { error: result.error });
      return NextResponse.json(
        { success: false, error: 'Failed to create flow metrics config' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    logError('Unexpected error in POST flow-metrics-config', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
