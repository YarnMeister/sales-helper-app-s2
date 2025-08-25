import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../../../../../lib/db';
import { logInfo, logError } from '../../../../../lib/log';

// PATCH - Update a canonical stage mapping
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { canonical_stage, start_stage, end_stage } = body;
    
    if (!canonical_stage || !start_stage || !end_stage) {
      return NextResponse.json(
        { success: false, error: 'canonical_stage, start_stage, and end_stage are required' },
        { status: 400 }
      );
    }
    
    logInfo('Updating canonical stage mapping', {
      id,
      canonical_stage,
      start_stage,
      end_stage
    });
    
    const result = await sql`
      UPDATE canonical_stage_mappings 
      SET 
        canonical_stage = ${canonical_stage},
        start_stage = ${start_stage},
        end_stage = ${end_stage},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Canonical stage mapping not found' },
        { status: 404 }
      );
    }
    
    logInfo('Successfully updated canonical stage mapping', {
      id,
      canonical_stage
    });
    
    return NextResponse.json({
      success: true,
      data: result[0],
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
    
    logInfo('Deleting canonical stage mapping', { id });
    
    const result = await sql`
      DELETE FROM canonical_stage_mappings 
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Canonical stage mapping not found' },
        { status: 404 }
      );
    }
    
    logInfo('Successfully deleted canonical stage mapping', {
      id,
      canonical_stage: result[0]?.canonical_stage
    });
    
    return NextResponse.json({
      success: true,
      data: result[0],
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
