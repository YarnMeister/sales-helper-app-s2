import { NextRequest, NextResponse } from 'next/server';
import { fetchPipedriveStages } from '../../../../lib/pipedrive';
import { logInfo, logError } from '../../../../lib/log';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stage_ids } = body;

    if (!stage_ids || !Array.isArray(stage_ids)) {
      return NextResponse.json(
        { success: false, error: 'stage_ids array is required' },
        { status: 400 }
      );
    }

    logInfo('Resolving stage names from stage IDs', { stage_ids });

    // Fetch all stages from Pipedrive
    const allStages = await fetchPipedriveStages();
    
    // Create a map of stage ID to stage info
    const stageMap: Record<number, { name: string; pipeline_id: number; pipeline_name: string }> = {};
    
    // Group stages by pipeline for pipeline name lookup
    const pipelineStages: Record<number, any[]> = {};
    allStages.forEach(stage => {
      if (!pipelineStages[stage.pipeline_id]) {
        pipelineStages[stage.pipeline_id] = [];
      }
      pipelineStages[stage.pipeline_id].push(stage);
    });

    // Resolve each requested stage ID
    for (const stageId of stage_ids) {
      const stage = allStages.find(s => s.id === stageId);
      if (stage) {
        // Get pipeline name (we'll use the first stage's pipeline name as a fallback)
        const pipelineName = stage.pipeline_name || `Pipeline ${stage.pipeline_id}`;
        
        stageMap[stageId] = {
          name: stage.name,
          pipeline_id: stage.pipeline_id,
          pipeline_name: pipelineName
        };
      }
    }

    logInfo('Successfully resolved stage names', { 
      requested: stage_ids.length, 
      resolved: Object.keys(stageMap).length 
    });

    return NextResponse.json({
      success: true,
      data: stageMap,
      message: 'Successfully resolved stage names'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Error resolving stage names', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resolve stage names',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
