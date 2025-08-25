import { NextRequest, NextResponse } from 'next/server';
import { fetchDealFlow } from '../../../../lib/pipedrive';
import { insertDealFlowData, insertDealMetadata } from '../../../../lib/db';
import { logInfo, logError } from '../../../../lib/log';
import { ExternalError } from '../../../../lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deal_id } = body;

    if (!deal_id) {
      return NextResponse.json(
        { success: false, error: 'deal_id is required' },
        { status: 400 }
      );
    }

    logInfo('Fetching Pipedrive deal flow data', { deal_id });

    // Fetch deal flow data from Pipedrive
    const flowData = await fetchDealFlow(deal_id);

    if (!flowData || flowData.length === 0) {
      logError('No flow data returned from Pipedrive', { deal_id });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error, the requested deal could not be fetched',
          message: 'No flow data found for this deal'
        },
        { status: 404 }
      );
    }

    // Process flow data to calculate durations and left_at times
    console.log('Raw flow data from Pipedrive:', flowData);
    
    const processedFlowData = flowData.map((event: any, index: number) => {
      const nextEvent = flowData[index + 1];
      const left_at = nextEvent ? nextEvent.entered_at : null;
      const duration_seconds = left_at 
        ? Math.floor((new Date(left_at).getTime() - new Date(event.entered_at).getTime()) / 1000)
        : null;

      const processedEvent = {
        deal_id: event.deal_id,
        pipeline_id: event.pipeline_id,
        stage_id: event.stage_id,
        stage_name: event.stage_name,
        entered_at: event.entered_at,
        left_at,
        duration_seconds
      };
      
      console.log('Processed event:', processedEvent);
      return processedEvent;
    });

    // Store flow data in database
    const insertResult = await insertDealFlowData(processedFlowData);

    // Store deal metadata (using first event for basic info)
    const firstEvent = flowData[0];
    const dealMetadata = {
      id: firstEvent.deal_id,
      title: firstEvent.deal_title || `Deal ${firstEvent.deal_id}`,
      pipeline_id: firstEvent.pipeline_id,
      stage_id: firstEvent.stage_id,
      status: 'active' // Default status
    };

    await insertDealMetadata(dealMetadata);

    logInfo('Successfully fetched and stored deal flow data', { 
      deal_id, 
      recordCount: processedFlowData.length 
    });

    return NextResponse.json({
      success: true,
      data: insertResult || processedFlowData,
      message: `Successfully fetched flow data for deal ${deal_id}`
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Error in deal flow API', { 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Error, the requested deal could not be fetched',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}
