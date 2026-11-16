import { NextRequest, NextResponse } from 'next/server';

const allowedOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

function corsHeaders(origin: string | null) {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key, X-Admin-API-Key',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  });
  if (origin === allowedOrigin) headers.set('Access-Control-Allow-Origin', origin);
  return headers;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const protectedMutation = !['GET', 'HEAD', 'OPTIONS'].includes(request.method) && /^\/api\/v1\/(admin|auth)(\/|$)/.test(request.nextUrl.pathname);
  if (protectedMutation && origin && origin !== allowedOrigin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: { code: 'ORIGIN_FORBIDDEN', message: 'This origin is not allowed.' } }, { status: 403, headers });
  }
  if (request.method === 'OPTIONS') return new NextResponse(null, { status: 204, headers });
  const response = NextResponse.next();
  headers.forEach((value, key) => response.headers.set(key, value));
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export const config = { matcher: ['/api/:path*'] };
