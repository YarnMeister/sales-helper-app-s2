import { NextRequest, NextResponse } from 'next/server';
import { CanonicalStageMappingsRepository } from '../../../../lib/database/repositories/flow-metrics-repository';
import { logInfo, logError } from '../../../../lib/log';

// GET - Fetch all canonical stage mappings
export async function GET() {
  try {
    logInfo('Fetching all canonical stage mappings with config via repository');
    
    const repository = new CanonicalStageMappingsRepository();
    const result = await repository.getMappingsWithConfig();
    
    if (!result.success) {
      logError('Repository failed to fetch canonical stage mappings', {
        error: result.error?.message,
        errorType: result.error?.type
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch canonical stage mappings',
          message: result.error?.message || 'Repository error'
        },
        { status: 500 }
      );
    }
    
    const mappings = result.data || [];
    
    logInfo('Successfully fetched canonical stage mappings via repository', {
      count: mappings.length
    });
    
    return NextResponse.json({
      success: true,
      data: mappings,
      message: 'Successfully fetched canonical stage mappings'
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Error fetching canonical stage mappings', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch canonical stage mappings',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}

// POST - Create a new canonical stage mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      metric_config_id, 
      canonical_stage, 
      start_stage_id, 
      end_stage_id, 
      start_stage, 
      end_stage,
      avg_min_days,
      avg_max_days,
      metric_comment 
    } = body;
    
    // Validate required fields
    if (!canonical_stage) {
      return NextResponse.json(
        { success: false, error: 'canonical_stage is required' },
        { status: 400 }
      );
    }
    
    // CRITICAL FIX: Require metric_config_id to maintain foreign key relationship
    if (!metric_config_id) {
      return NextResponse.json(
        { success: false, error: 'metric_config_id is required to link mapping to flow metric config' },
        { status: 400 }
      );
    }
    
    // Require either stage IDs or stage names
    if ((!start_stage_id && !start_stage) || (!end_stage_id && !end_stage)) {
      return NextResponse.json(
        { success: false, error: 'Both start and end stages are required (either as IDs or names)' },
        { status: 400 }
      );
    }
    
    logInfo('Creating new canonical stage mapping via repository', {
      metric_config_id,
      canonical_stage,
      start_stage_id,
      end_stage_id,
      start_stage,
      end_stage,
      avg_min_days,
      avg_max_days,
      has_metric_comment: !!metric_comment
    });
    
    const repository = new CanonicalStageMappingsRepository();
    const result = await repository.create({
      metricConfigId: metric_config_id,
      canonicalStage: canonical_stage,
      startStageId: start_stage_id || null,
      endStageId: end_stage_id || null,
      startStage: start_stage || null,
      endStage: end_stage || null,
      avgMinDays: avg_min_days || null,
      avgMaxDays: avg_max_days || null,
      metricComment: metric_comment || null
    });
    
    if (!result.success) {
      logError('Repository failed to create canonical stage mapping', {
        error: result.error?.message,
        errorType: result.error?.type
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create canonical stage mapping',
          message: result.error?.message || 'Repository error'
        },
        { status: 500 }
      );
    }
    
    logInfo('Successfully created canonical stage mapping via repository', {
      id: result.data?.id,
      canonical_stage,
      metric_config_id
    });
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Successfully created canonical stage mapping'
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Error creating canonical stage mapping', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create canonical stage mapping',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
