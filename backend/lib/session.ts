import crypto from 'node:crypto';
import { NextRequest } from 'next/server';

const SESSION_TTL_SECONDS = 60 * 60 * 8;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters.');
  return value;
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(value: string) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

export function createSessionToken(email: string) {
  const payload = { sub: email.toLowerCase(), iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const encoded = encode(payload);
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  let expected: string;
  try { expected = sign(payload); } catch { return false; }
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number; sub?: string };
    return Boolean(data.sub && data.exp && data.exp > Math.floor(Date.now() / 1000));
  } catch {
    return false;
  }
}

export function sessionCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, maxAge: SESSION_TTL_SECONDS, path: '/' };
}

export function getSessionTtlSeconds() {
  return SESSION_TTL_SECONDS;
}
