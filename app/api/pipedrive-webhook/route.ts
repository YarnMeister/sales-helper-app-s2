import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logInfo, logError } from '@/lib/log';
import { generateCorrelationId, withPerformanceLogging } from '@/lib/log';

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
      
      // 4. PHASE 1: Just log the deal_id and return success
      logInfo('✅ PHASE 1 SUCCESS: Deal ID received from Zapier', { 
        correlationId,
        deal_id: validatedData.deal_id,
        message: `Deal ${validatedData.deal_id} successfully received from Zapier webhook`
      });
      
      // 5. Return immediate success response
      return NextResponse.json({ 
        status: 'ok',
        message: `Deal ${validatedData.deal_id} received successfully`,
        phase: 1,
        correlationId
      });
      
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
