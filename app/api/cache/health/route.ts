import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if environment variables are set
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Redis environment variables not configured' 
      }, { status: 500 });
    }

    // Import Redis client dynamically to avoid initialization issues
    const { redis } = await import('@/lib/redis');
    
    const probeKey = 'health:probe';
    await redis.set(probeKey, '1', { ex: 30 });
    const v = await redis.get(probeKey);
    return NextResponse.json({ ok: v === '1' });
  } catch (e: any) {
    console.error('Cache health check failed:', e);
    return NextResponse.json({ 
      ok: false, 
      error: e?.message,
      stack: e?.stack 
    }, { status: 500 });
  }
}
