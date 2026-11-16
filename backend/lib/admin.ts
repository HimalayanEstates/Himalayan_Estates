import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api';
import { isSessionActive } from '@/lib/session-store';

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  try {
    if (await isSessionActive(request.cookies.get('he_session')?.value)) return null;
  } catch {
    return apiError(503, 'AUTH_UNAVAILABLE', 'Session validation is temporarily unavailable.');
  }
  const configuredKey = process.env.ADMIN_API_KEY;
  const providedKey = request.headers.get('x-admin-api-key');
  if (!configuredKey || !providedKey || !safeSecretEqual(providedKey, configuredKey)) {
    return apiError(401, 'UNAUTHORIZED', 'Valid staff authentication is required.');
  }
  return null;
}

function safeSecretEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
