import { NextRequest, NextResponse } from 'next/server';
import { getDealFlowData } from '../../../../lib/db';
import { logInfo, logError } from '../../../../lib/log';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');

    logInfo('Fetching stored deal flow data', { deal_id: dealId });

    const data = await getDealFlowData(dealId ? parseInt(dealId) : undefined);

    return NextResponse.json({
      success: true,
      data,
      message: 'Successfully fetched deal flow data'
    });

  } catch (error) {
    logError('Error fetching deal flow data', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch deal flow data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
