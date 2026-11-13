import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api';
import { createSessionToken, getSessionTtlSeconds, sessionCookieOptions, verifySessionToken } from '@/lib/session';

export async function POST(request: NextRequest) {
  const current = request.cookies.get('he_session')?.value;
  if (!verifySessionToken(current)) return apiError(401, 'UNAUTHORIZED', 'A valid session is required.');
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) return apiError(503, 'AUTH_NOT_CONFIGURED', 'Administrator authentication is not configured.');
  const response = apiSuccess({ user: { email, role: 'ADMINISTRATOR' }, expiresIn: getSessionTtlSeconds() });
  response.cookies.set('he_session', createSessionToken(email), sessionCookieOptions());
  return response;
}
