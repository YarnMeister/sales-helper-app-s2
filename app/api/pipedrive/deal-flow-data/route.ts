import { NextRequest, NextResponse } from 'next/server';
import { getDealFlowData } from '../../../../lib/db';
import { logInfo, logError } from '../../../../lib/log';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');

    logInfo('Fetching stored deal flow data', { deal_id: dealId });

    const data = await getDealFlowData(dealId ? parseInt(dealId) : undefined);

    logInfo('Successfully fetched deal flow data', { 
      deal_id: dealId, 
      recordCount: data?.length || 0 
    });

    return NextResponse.json({
      success: true,
      data: data || [],
      message: 'Successfully fetched deal flow data'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Error in deal flow data API', { 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch deal flow data',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
