import { NextRequest, NextResponse } from 'next/server';
import { getDealFlowData } from '../../../lib/db';
import { logInfo, logError } from '../../../lib/log';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');

    logInfo('Fetching stored deal flow data', { deal_id: dealId });

    const result = await getDealFlowData(dealId ? parseInt(dealId) : undefined);

    if (!result.success) {
      logError('Failed to fetch deal flow data', { 
        deal_id: dealId, 
        error: result.error 
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch deal flow data',
          message: result.error
        },
        { status: 500 }
      );
    }

    logInfo('Successfully fetched deal flow data', { 
      deal_id: dealId, 
      recordCount: result.data?.length || 0 
    });

    return NextResponse.json({
      success: true,
      data: result.data || [],
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
