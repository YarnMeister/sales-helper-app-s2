import { NextRequest, NextResponse } from 'next/server';
import { CanonicalStageMappingsRepository } from '../../../../../lib/database/repositories/flow-metrics-repository';
import { logInfo, logError } from '../../../../../lib/log';

// PATCH - Update a canonical stage mapping
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { canonical_stage, start_stage_id, end_stage_id, start_stage, end_stage } = body;
    
    if (!canonical_stage) {
      return NextResponse.json(
        { success: false, error: 'canonical_stage is required' },
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
    
    logInfo('Updating canonical stage mapping', {
      id,
      canonical_stage,
      start_stage_id,
      end_stage_id,
      start_stage,
      end_stage
    });
    
    const repository = new CanonicalStageMappingsRepository();
    const result = await repository.update(id, {
      canonicalStage: canonical_stage,
      startStageId: start_stage_id || null,
      endStageId: end_stage_id || null,
      startStage: start_stage || null,
      endStage: end_stage || null
    });
    
    if (!result.success) {
      logError('Repository failed to update canonical stage mapping', {
        error: result.error?.message,
        errorType: result.error?.type
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update canonical stage mapping',
          message: result.error?.message || 'Repository error'
        },
        { status: result.error?.type === 'not_found' ? 404 : 500 }
      );
    }
    
    if (!result.data) {
      return NextResponse.json(
        { success: false, error: 'Canonical stage mapping not found' },
        { status: 404 }
      );
    }
    
    logInfo('Successfully updated canonical stage mapping via repository', {
      id,
      canonical_stage
    });
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Successfully updated canonical stage mapping'
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Error updating canonical stage mapping', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update canonical stage mapping',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a canonical stage mapping
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    logInfo('Deleting canonical stage mapping via repository', { id });
    
    const repository = new CanonicalStageMappingsRepository();
    
    // First get the mapping to return its data if deletion succeeds
    const findResult = await repository.findById(id);
    if (!findResult.success) {
      logError('Repository failed to find canonical stage mapping for deletion', {
        error: findResult.error?.message,
        errorType: findResult.error?.type
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to find canonical stage mapping',
          message: findResult.error?.message || 'Repository error'
        },
        { status: 500 }
      );
    }
    
    if (!findResult.data) {
      return NextResponse.json(
        { success: false, error: 'Canonical stage mapping not found' },
        { status: 404 }
      );
    }
    
    const mappingToDelete = findResult.data;
    
    // Now delete the mapping
    const deleteResult = await repository.delete(id);
    if (!deleteResult.success) {
      logError('Repository failed to delete canonical stage mapping', {
        error: deleteResult.error?.message,
        errorType: deleteResult.error?.type
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete canonical stage mapping',
          message: deleteResult.error?.message || 'Repository error'
        },
        { status: 500 }
      );
    }
    
    if (!deleteResult.data) {
      return NextResponse.json(
        { success: false, error: 'Canonical stage mapping not found' },
        { status: 404 }
      );
    }
    
    logInfo('Successfully deleted canonical stage mapping via repository', {
      id,
      canonical_stage: mappingToDelete.canonicalStage
    });
    
    return NextResponse.json({
      success: true,
      data: mappingToDelete,
      message: 'Successfully deleted canonical stage mapping'
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Error deleting canonical stage mapping', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete canonical stage mapping',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
