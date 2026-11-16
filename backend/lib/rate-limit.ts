import { NextRequest } from 'next/server';
import { apiError } from '@/lib/api';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function enforceRateLimit(request: NextRequest, namespace: string, limit: number, windowMs: number) {
  // Only enable behind a proxy that replaces client-supplied forwarding headers.
  const trusted = process.env.TRUST_PROXY_HEADERS === 'true';
  const forwarded = trusted ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() : undefined;
  const ip = (forwarded || (trusted ? request.headers.get('x-real-ip') : undefined) || 'unknown').slice(0, 128);
  const key = `${namespace}:${ip}`;
  const now = Date.now();
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  bucket.count += 1;
  buckets.set(key, bucket);
  if (buckets.size > 5000) buckets.forEach((value, bucketKey) => { if (value.resetAt <= now) buckets.delete(bucketKey); });
  if (bucket.count > limit) {
    const response = apiError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.');
    response.headers.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    return response;
  }
  return null;
}
