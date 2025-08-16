import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_URL/TOKEN not set');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// convenience helpers
export async function cacheGet<T = unknown>(key: string) {
  return (await redis.get<T>(key)) ?? null;
}

export async function cacheSet<T = unknown>(key: string, value: T, ttlSec?: number) {
  if (ttlSec) return redis.set(key, value, { ex: ttlSec });
  return redis.set(key, value);
}
