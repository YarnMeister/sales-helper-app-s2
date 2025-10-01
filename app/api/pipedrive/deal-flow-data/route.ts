import { NextRequest, NextResponse } from 'next/server';
import { getDealFlowData } from '@/lib/db';
import { logInfo, logError } from '@/lib/log';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');

    logInfo('Fetching stored deal flow data', { deal_id: dealId });

    const rawData = await getDealFlowData(dealId ? parseInt(dealId) : undefined);

    // Transform data to match UI expectations
    const transformedData = rawData.map((row: any) => ({
      id: row.id,
      dealId: row.deal_id,
      pipelineId: row.pipeline_id,
      stageId: row.stage_id,
      stageName: row.stage_name,
      timestamp: row.entered_at, // Map entered_at to timestamp
      dealTitle: row.deal_title || null,
      dealValue: row.deal_value || null,
      dealCurrency: row.deal_currency || null,
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
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
