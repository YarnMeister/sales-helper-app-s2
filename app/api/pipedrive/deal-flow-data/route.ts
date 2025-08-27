import { NextRequest, NextResponse } from 'next/server';
import { getDealFlowData, getDealFlowDataPaginated } from '../../../../lib/db';
import { logInfo, logError } from '../../../../lib/log';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const usePagination = searchParams.get('paginated') === 'true';

    logInfo('Fetching stored deal flow data', { 
      deal_id: dealId, 
      page, 
      limit, 
      usePagination 
    });

    let data;
    let totalCount = 0;

    if (usePagination) {
      const result = await getDealFlowDataPaginated(
        dealId ? parseInt(dealId) : undefined,
        page,
        limit
      );
      data = result.data;
      totalCount = result.totalCount;
    } else {
      data = await getDealFlowData(dealId ? parseInt(dealId) : undefined);
      totalCount = data?.length || 0;
    }

    logInfo('Successfully fetched deal flow data', { 
      deal_id: dealId, 
      recordCount: data?.length || 0,
      totalCount,
      page,
      limit
    });

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: usePagination ? {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1
      } : undefined,
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
