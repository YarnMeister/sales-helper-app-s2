import { NextRequest, NextResponse } from 'next/server';
import { getFlowMetricsConfig, createFlowMetricConfig } from '../../../../lib/db';
import { logError, logInfo } from '../../../../lib/log';

export async function GET() {
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
  try {
    const body = await request.json();
    logInfo('POST /api/admin/flow-metrics-config - Creating flow metric configuration', body);
    
    // Validate required fields
    const { metric_key, display_title, canonical_stage, start_stage, end_stage } = body;
    
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
    
    const newConfig = await createFlowMetricConfig({
      metric_key,
      display_title,
      canonical_stage,
      sort_order: body.sort_order,
      is_active: body.is_active !== false,
      start_stage,
      end_stage
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
