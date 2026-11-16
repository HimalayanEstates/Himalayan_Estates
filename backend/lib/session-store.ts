import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { getSessionId, verifySessionToken } from '@/lib/session';

function revocationKey(token: string) {
  return `auth.revoked.${crypto.createHash('sha256').update(getSessionId(token) as string).digest('hex')}`;
}

export async function isSessionActive(token: string | undefined) {
  if (!token || !verifySessionToken(token)) return false;
  return !(await db.siteSetting.findUnique({ where: { settingKey: revocationKey(token) }, select: { id: true } }));
}

export async function revokeSession(token: string | undefined) {
  if (!token || !verifySessionToken(token)) return;
  const settingKey = revocationKey(token);
  await db.siteSetting.upsert({ where: { settingKey }, create: { settingKey, value: { revokedAt: new Date().toISOString() } }, update: { value: { revokedAt: new Date().toISOString() } } });
}
