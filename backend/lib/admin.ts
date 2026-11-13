import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api';
import { verifySessionToken } from '@/lib/session';

export function requireAdmin(request: NextRequest): NextResponse | null {
  if (verifySessionToken(request.cookies.get('he_session')?.value)) return null;
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
