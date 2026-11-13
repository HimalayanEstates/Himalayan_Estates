import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api';
import { enforceRateLimit } from '@/lib/rate-limit';
import { verifyPassword } from '@/lib/password';
import { createSessionToken, getSessionTtlSeconds, sessionCookieOptions } from '@/lib/session';

const signInSchema = z.object({ email: z.string().trim().email().max(200), password: z.string().min(8).max(200) });

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(request, 'auth-sign-in', 5, 15 * 60 * 1000);
  if (rateLimited) return rateLimited;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Email and password are required.', parsed.error.flatten().fieldErrors);
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredHash = process.env.ADMIN_PASSWORD_HASH;
  if (!configuredEmail || !configuredHash || !process.env.SESSION_SECRET) return apiError(503, 'AUTH_NOT_CONFIGURED', 'Administrator authentication is not configured.');
  const valid = Boolean(configuredEmail && configuredHash && parsed.data.email.toLowerCase() === configuredEmail && verifyPassword(parsed.data.password, configuredHash));
  if (!valid) return apiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  const token = createSessionToken(configuredEmail as string);
  const response = apiSuccess({ user: { email: configuredEmail, role: 'ADMINISTRATOR' }, expiresIn: getSessionTtlSeconds() });
  response.cookies.set('he_session', token, sessionCookieOptions());
  return response;
}
