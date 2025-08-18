import { NextRequest } from 'next/server';
import { z } from 'zod';
import { env } from '@/lib/env.server';
import { withPerformanceLogging, logInfo, logError, generateCorrelationId } from '@/lib/log';

const CheckInNotificationSchema = z.object({
  salesperson: z.string().min(1, 'Salesperson is required'),
  planned_mines: z.array(z.string().min(1)).min(1, 'At least one mine is required'),
  main_purpose: z.string().min(1, 'Main purpose is required'),
  availability: z.string().min(1, 'Availability is required'),
  comments: z.string().optional(),
  submit_mode: z.enum(['mock', 'live']).default('live')
});

function formatCheckInMessage(data: z.infer<typeof CheckInNotificationSchema>): string {
  const mineNames = data.planned_mines.join(', ');
  
  let message = `Hi, this is *${data.salesperson}*, today I'll be visiting *${mineNames}*. The main purpose of the visit is: *${data.main_purpose}*. I'll be available on mobile throughout the day and I'll be back in office *${data.availability}*.`;
  
  if (data.submit_mode === 'mock') {
    message += `\n\n*[TEST MODE - ${data.submit_mode.toUpperCase()}]*`;
  }
  
  if (data.comments && data.comments.trim()) {
    message += `\n\nAdditional comments: ${data.comments}`;
  }
  
  return message;
}

export async function POST(req: NextRequest) {
  return withPerformanceLogging('POST /api/slack/notify-checkin', 'api', async () => {
    const correlationId = generateCorrelationId();
    
    try {
      // Check if Slack is configured
      if (!env.SLACK_BOT_TOKEN) {
        logError('Slack integration not configured', { correlationId });
        return Response.json({
          ok: false,
          error: 'Slack integration not configured'
        }, { status: 503 });
      }
      
      // Parse and validate request body
      const body = await req.json();
      const validatedData = CheckInNotificationSchema.parse(body);
      
      // Determine submit mode and channel
      const submitMode = validatedData.submit_mode || 'live';
      
      const targetChannel = submitMode === 'mock' 
        ? env.SLACK_CHANNEL_MOCK
        : env.SLACK_CHANNEL_LIVE;
      
      // Format message
      const messageText = formatCheckInMessage({
        ...validatedData,
        submit_mode: submitMode
      });
      
      logInfo('Sending Slack notification', { 
        correlationId,
        channel: targetChannel, 
        mode: submitMode 
      });
      
      // Send to Slack API
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: targetChannel,
          text: messageText,
          unfurl_links: false,
          unfurl_media: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.ok) {
        logError('Slack API error', { 
          correlationId,
          error: result.error, 
          channel: targetChannel 
        });
        return Response.json({
          ok: false,
          error: `Slack API error: ${result.error}`,
          channel: targetChannel
        }, { status: 500 });
      }
      
      logInfo('Slack notification sent successfully', { 
        correlationId,
        channel: targetChannel, 
        timestamp: result.ts 
      });
      
      return Response.json({ 
        ok: true, 
        channel: targetChannel,
        mode: submitMode,
        timestamp: result.ts 
      });
      
    } catch (error) {
      logError('Slack notification failed', { 
        correlationId,
        error: error instanceof Error ? error.message : String(error) 
      });
      
      if (error instanceof z.ZodError) {
        return Response.json({
          ok: false,
          error: 'Invalid request data',
          details: error.errors
        }, { status: 422 });
      }
      
      return Response.json({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }, { status: 500 });
    }
  });
}
