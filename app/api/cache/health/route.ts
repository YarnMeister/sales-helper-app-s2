import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    const probeKey = 'health:probe';
    await redis.set(probeKey, '1', { ex: 30 });
    const v = await redis.get(probeKey);
    return NextResponse.json({ ok: v === '1' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
