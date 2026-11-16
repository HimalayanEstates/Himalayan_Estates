import { NextRequest, NextResponse } from 'next/server';
import { revokeSession } from '@/lib/session-store';
import { apiError } from '@/lib/api';
import { sessionCookieOptions } from '@/lib/session';

export async function POST(request: NextRequest) {
  try { await revokeSession(request.cookies.get('he_session')?.value); }
  catch { return apiError(503, 'AUTH_UNAVAILABLE', 'Could not revoke this session. Please retry signing out.'); }
  const response = NextResponse.json({ success: true });
  response.cookies.set('he_session', '', { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
