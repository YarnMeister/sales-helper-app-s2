import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/lib/env';
import { logInfo, logError } from '@/lib/log';
import { generateCorrelationId } from '@/lib/log';
import { withTiming } from '@/lib/log';

// Validation schema for check-in notification data
const CheckInNotificationSchema = z.object({
  salesperson: z.enum(['James', 'Luyanda', 'Stefan'], {
    errorMap: () => ({ message: "Salesperson must be one of: James, Luyanda, Stefan" })
  }),
  planned_mines: z.array(z.string().min(1)).min(1, "At least one mine must be selected"),
  main_purpose: z.enum(['Quote follow-up', 'Delivery', 'Site check', 'Installation support', 'General sales visit'], {
    errorMap: () => ({ message: "Invalid purpose selected" })
  }),
  availability: z.enum(['Later this morning', 'In the afternoon', 'Tomorrow'], {
    errorMap: () => ({ message: "Invalid availability selected" })
  }),
  comments: z.string().optional(),
});

// Format check-in message for Slack
function formatCheckInMessage(data: z.infer<typeof CheckInNotificationSchema>): string {
  const mineNames = data.planned_mines.join(', ');
  
  let message = `Hi, this is *${data.salesperson}*, today I'll be visiting *${mineNames}*. The main purpose of the visit is: *${data.main_purpose}*. I'll be available on mobile throughout the day and I'll be back in office *${data.availability}*.`;
  
  if (data.comments && data.comments.trim()) {
    message += `\n\nAdditional comments: ${data.comments}`;
  }
  
  return message;
}

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  
  return await withTiming('POST /api/slack/notify-checkin', async () => {
    try {
      logInfo('Slack check-in notification request started', { correlationId });
      
      // Check if Slack is configured
      if (!env.SLACK_BOT_TOKEN) {
        logError('Slack notification failed - SLACK_BOT_TOKEN not configured', { correlationId });
        return NextResponse.json({
          ok: false,
          error: 'Slack integration not configured'
        }, { status: 503 });
      }
      
      const body = await req.json();
      
      // Validate request body
      const validatedData = CheckInNotificationSchema.parse(body);
      
      logInfo('Check-in notification data validated', { 
        correlationId,
        salesperson: validatedData.salesperson,
        minesCount: validatedData.planned_mines.length,
        purpose: validatedData.main_purpose,
        channel: env.SLACK_CHANNEL
      });
      
      // Format message for Slack
      const messageText = formatCheckInMessage(validatedData);
      
      // Prepare Slack API request
      const slackMessage = {
        channel: env.SLACK_CHANNEL,
        text: messageText,
        unfurl_links: false,
        unfurl_media: false
      };
      
      logInfo('Sending message to Slack', { 
        correlationId,
        channel: env.SLACK_CHANNEL,
        messageLength: messageText.length
      });
      
      // Send to Slack API
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(slackMessage)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Slack API error: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error}`);
      }
      
      logInfo('Slack notification sent successfully', { 
        correlationId,
        channel: env.SLACK_CHANNEL,
        messageTs: result.ts
      });
      
      return NextResponse.json({
        ok: true,
        data: {
          channel: env.SLACK_CHANNEL,
          message_ts: result.ts,
          message: messageText
        }
      });
      
    } catch (error) {
      logError('Slack notification failed', { 
        correlationId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          ok: false,
          error: 'Validation failed',
          details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        }, { status: 400 });
      }
      
      return NextResponse.json({
        ok: false,
        error: `Failed to send Slack notification: ${error instanceof Error ? error.message : String(error)}`
      }, { status: 500 });
    }
  });
}
