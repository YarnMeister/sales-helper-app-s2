import { NextRequest, NextResponse } from 'next/server';
import { getDealsForCanonicalStage } from '../../../../lib/db';
import { logInfo, logError } from '../../../../lib/log';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const canonicalStage = searchParams.get('canonicalStage');
    const period = searchParams.get('period');

    if (!canonicalStage) {
      return NextResponse.json(
        { success: false, error: 'canonicalStage parameter is required' },
        { status: 400 }
      );
    }

    logInfo('Fetching deals for canonical stage', { canonicalStage, period });

    const deals = await getDealsForCanonicalStage(canonicalStage, period || undefined);

    logInfo('Successfully fetched deals for canonical stage', {
      canonicalStage,
      dealCount: deals?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: deals || [],
      message: `Successfully fetched deals for ${canonicalStage}`
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Error in canonical stage deals API', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch deals for canonical stage',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
