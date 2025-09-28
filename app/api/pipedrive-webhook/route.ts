import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logInfo, logError } from '@/lib/log';
import { generateCorrelationId, withPerformanceLogging } from '@/lib/log';
import { fetchDealFlow } from '@/lib/pipedrive';
import { insertDealFlowData } from '@/lib/db';
import { ensureDatabaseInitialized } from '@/lib/database/init';

// Validation schema for Zapier webhook payload
const ZapierWebhookSchema = z.object({
  deal_id: z.union([
    z.number(),
    z.string().transform((val) => parseInt(val, 10))
  ]).refine((val) => !isNaN(val) && val > 0, {
    message: "deal_id must be a valid positive number"
  })
});

export async function POST(request: NextRequest) {
  // Ensure repository system is initialized
  ensureDatabaseInitialized();

  const correlationId = generateCorrelationId();

  return await withPerformanceLogging('POST /api/pipedrive-webhook', 'api', async () => {
    try {
      logInfo('🎯 PHASE 1: Zapier webhook received', { correlationId });
      
      // 1. Validate HTTP method
      if (request.method !== 'POST') {
        return NextResponse.json(
          { error: 'Method Not Allowed' },
          { status: 405 }
        );
      }
      
      // 2. Validate secret header
      const secret = request.headers.get('x-zapier-secret');
      const expectedSecret = process.env.ZAPIER_WEBHOOK_SECRET;
      
      if (!expectedSecret) {
        logError('❌ ZAPIER_WEBHOOK_SECRET not configured', { correlationId });
        return NextResponse.json(
          { error: 'Webhook not configured' },
          { status: 503 }
        );
      }
      
      if (secret !== expectedSecret) {
        logError('❌ Invalid webhook secret', { correlationId });
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
      
      // 3. Parse and validate request body
      const body = await request.json();
      const validatedData = ZapierWebhookSchema.parse(body);
      
      // 4. PHASE 2: Fetch and store flow data
      logInfo('🔄 PHASE 2: Starting flow data fetch and storage', {
        correlationId,
        deal_id: validatedData.deal_id
      });

      try {
        // Fetch flow data from Pipedrive
        const flowData = await fetchDealFlow(validatedData.deal_id);
        
        if (!flowData || flowData.length === 0) {
          logError('❌ PHASE 2 FAILED: No flow data returned from Pipedrive', {
            correlationId,
            deal_id: validatedData.deal_id
          });
          
          return NextResponse.json({
            status: 'partial_success',
            message: `Deal ${validatedData.deal_id} received but no flow data found`,
            phase: 1,
            correlationId,
            error: 'No flow data found for this deal'
          }, { status: 200 });
        }
        
        logInfo('📊 PHASE 2: Flow data fetched successfully', {
          correlationId,
          deal_id: validatedData.deal_id,
          flowEventsCount: flowData.length
        });

        // Process flow data to calculate durations and left_at times (same as deal-flow API)
        const stageChanges = flowData
          .filter((event: any) => event.object === 'dealChange' && event.data.field_key === 'stage_id')
          .map((event: any) => ({
            pipedrive_event_id: event.data.id,
            deal_id: event.data.item_id,
            stage_id: parseInt(event.data.new_value),
            stage_name: event.data.additional_data?.new_value_formatted || `Stage ${event.data.new_value}`,
            entered_at: event.timestamp,
            old_stage_id: parseInt(event.data.old_value),
            old_stage_name: event.data.additional_data?.old_value_formatted || `Stage ${event.data.old_value}`,
            user_id: event.data.user_id,
            log_time: event.data.log_time
          }))
          .sort((a: any, b: any) => new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime());
        
        // Calculate durations and left_at times
        const processedFlowData = stageChanges.map((event: any, index: number) => {
          const nextEvent = stageChanges[index + 1];
          const left_at = nextEvent ? nextEvent.entered_at : null;
          const duration_seconds = left_at 
            ? Math.floor((new Date(left_at).getTime() - new Date(event.entered_at).getTime()) / 1000)
            : null;

          return {
            pipedrive_event_id: event.pipedrive_event_id,
            deal_id: event.deal_id,
            pipeline_id: 1, // Default pipeline ID
            stage_id: event.stage_id,
            stage_name: event.stage_name,
            entered_at: event.entered_at,
            left_at,
            duration_seconds
          };
        });

        // Store processed flow data in database
        await insertDealFlowData(processedFlowData);
        
        logInfo('💾 PHASE 2: Flow data stored successfully', {
          correlationId,
          deal_id: validatedData.deal_id,
          message: `Deal ${validatedData.deal_id} flow data processed and stored`
        });

        return NextResponse.json({
          status: 'ok',
          message: `Deal ${validatedData.deal_id} processed successfully - flow data fetched and stored`,
          phase: 2,
          correlationId,
          flowEventsCount: processedFlowData.length
        });

      } catch (phase2Error) {
        logError('❌ PHASE 2 FAILED: Flow data processing error', {
          correlationId,
          deal_id: validatedData.deal_id,
          error: phase2Error instanceof Error ? phase2Error.message : String(phase2Error)
        });

        // Return 200 OK even if Phase 2 fails, but include error info
        return NextResponse.json({
          status: 'partial_success',
          message: `Deal ${validatedData.deal_id} received but flow processing failed`,
          phase: 1,
          correlationId,
          error: phase2Error instanceof Error ? phase2Error.message : String(phase2Error)
        }, { status: 200 });
      }
      
    } catch (error) {
      logError('❌ PHASE 1 FAILED: Webhook processing error', { 
        correlationId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        }, { status: 400 });
      }
      
      return NextResponse.json({
        error: 'Internal server error'
      }, { status: 500 });
    }
  });
}
