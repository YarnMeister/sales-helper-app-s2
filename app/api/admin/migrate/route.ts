import { NextRequest, NextResponse } from 'next/server';
import { postDeployMigrate } from '../../../../scripts/post-deploy-migrate';

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization (you can add more security here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🔄 Admin migration endpoint triggered');
    
    const result = await postDeployMigrate();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Migration endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Migration endpoint - use POST to trigger migrations',
    timestamp: new Date().toISOString()
  });
}
