import { NextRequest } from 'next/server';
import { isSessionActive } from '@/lib/session-store';
import { apiError, apiSuccess } from '@/lib/api';
import { createSessionToken, getSessionId, getSessionTtlSeconds, sessionCookieOptions } from '@/lib/session';

export async function POST(request: NextRequest) {
  const current = request.cookies.get('he_session')?.value;
  try {
    if (!(await isSessionActive(current))) return apiError(401, 'UNAUTHORIZED', 'A valid session is required.');
  } catch { return apiError(503, 'AUTH_UNAVAILABLE', 'Session validation is temporarily unavailable.'); }
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) return apiError(503, 'AUTH_NOT_CONFIGURED', 'Administrator authentication is not configured.');
  const response = apiSuccess({ user: { email, role: 'ADMINISTRATOR' }, expiresIn: getSessionTtlSeconds() });
  response.cookies.set('he_session', createSessionToken(email, getSessionId(current as string)), sessionCookieOptions());
  return response;
}
