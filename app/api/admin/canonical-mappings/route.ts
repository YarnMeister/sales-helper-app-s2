import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';
import { logInfo, logError } from '../../../../lib/log';

// GET - Fetch all canonical stage mappings
export async function GET() {
  try {
    logInfo('Fetching all canonical stage mappings');
    
    const mappings = await sql`
      SELECT * FROM canonical_stage_mappings 
      ORDER BY canonical_stage, created_at DESC
    `;
    
    logInfo('Successfully fetched canonical stage mappings', {
      count: mappings?.length || 0
    });
    
    return NextResponse.json({
      success: true,
      data: mappings || [],
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
    
    logInfo('Creating new canonical stage mapping', {
      canonical_stage,
      start_stage_id,
      end_stage_id,
      start_stage,
      end_stage
    });
    
    const result = await sql`
      INSERT INTO canonical_stage_mappings (
        canonical_stage, 
        start_stage_id, 
        end_stage_id, 
        start_stage, 
        end_stage
      )
      VALUES (
        ${canonical_stage}, 
        ${start_stage_id || null}, 
        ${end_stage_id || null}, 
        ${start_stage || ''}, 
        ${end_stage || ''}
      )
      RETURNING *
    `;
    
    logInfo('Successfully created canonical stage mapping', {
      id: result[0]?.id,
      canonical_stage
    });
    
    return NextResponse.json({
      success: true,
      data: result[0],
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
