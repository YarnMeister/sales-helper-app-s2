import { env } from '@/lib/env.server';

export async function GET() {
  return Response.json({
    ok: true,
    environment: {
      APP_ENV: env.APP_ENV,
      EXTERNAL_SUBMIT_MODE: env.EXTERNAL_SUBMIT_MODE,
      SLACK_CHANNEL_LIVE: env.SLACK_CHANNEL_LIVE,
      SLACK_CHANNEL_MOCK: env.SLACK_CHANNEL_MOCK,
      SLACK_BOT_TOKEN: env.SLACK_BOT_TOKEN ? 'configured' : 'missing',
      timestamp: new Date().toISOString()
    }
  });
}
