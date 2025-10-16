import { NextRequest, NextResponse } from 'next/server';
import { getDealsForMetric } from '../../../../lib/db';
import { logInfo, logError } from '../../../../lib/log';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metricKey = searchParams.get('metricKey');
    const period = searchParams.get('period');

    if (!metricKey) {
      return NextResponse.json(
        { success: false, error: 'metricKey parameter is required' },
        { status: 400 }
      );
    }

    logInfo('Fetching deals for metric', { metricKey, period });

    const deals = await getDealsForMetric(metricKey, period || undefined);

    logInfo('Successfully fetched deals for metric', {
      metricKey,
      dealCount: deals?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: deals || [],
      message: `Successfully fetched deals for metric ${metricKey}`
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Error in metric deals API', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch deals for metric',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
