import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import type { Property, PropertyMedia } from '@prisma/client';
import { NextRequest } from 'next/server';
import { createSessionToken, getSessionId, verifySessionToken } from '../lib/session';
import { isSessionActive, revokeSession } from '../lib/session-store';
import { db } from '../lib/db';
import { requireAdmin } from '../lib/admin';
import { publicProperty } from '../lib/public-property';
import { PUBLIC_SETTING_KEYS } from '../lib/public-settings';
import { propertyInputSchema } from '../lib/property-validation';
import { settingSchema } from '../lib/cms-validation';
import { enforceRateLimit } from '../lib/rate-limit';
import { middleware } from '../middleware';

process.env.SESSION_SECRET = 'synthetic-test-secret-at-least-32-characters';
process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.ADMIN_PASSWORD_HASH = 'synthetic-hash';
delete process.env.ADMIN_API_KEY;
delete process.env.TRUST_PROXY_HEADERS;
const originalSettings = db.siteSetting;
afterEach(() => { mock.restoreAll(); Object.defineProperty(db, 'siteSetting', { value: originalSettings, configurable: true }); process.env.ADMIN_PASSWORD_HASH = 'synthetic-hash'; });
const request = (path: string, headers = {}, method = 'GET') => new NextRequest(`http://localhost:4000/api/v1/${path}`, { method, headers });

test('signed sessions reject tampering, extra segments and expiry', () => {
  const token = createSessionToken('admin@example.test');
  assert.equal(verifySessionToken(token), true);
  assert.equal(verifySessionToken(token + '.extra'), false);
  assert.equal(verifySessionToken('invalid.' + token.split('.')[1]), false);
  const now = Date.now();
  mock.method(Date, 'now', () => now + 9 * 60 * 60 * 1000);
  assert.equal(verifySessionToken(token), false);
});

test('credential changes invalidate previously issued sessions', () => {
  const token = createSessionToken('admin@example.test');
  process.env.ADMIN_PASSWORD_HASH = 'rotated-hash';
  assert.equal(verifySessionToken(token), false);
});

test('wrong administrator subject is rejected', () => {
  assert.equal(verifySessionToken(createSessionToken('other@example.test')), false);
});

test('logout revokes every token in the refreshed session family', async () => {
  const revoked = new Set<string>();
  Object.defineProperty(db, 'siteSetting', { configurable: true, value: {
    findUnique: async ({ where }: { where: { settingKey: string } }) => revoked.has(where.settingKey) ? { id: 'synthetic' } : null,
    upsert: async ({ where }: { where: { settingKey: string } }) => { revoked.add(where.settingKey); return {}; },
  } });
  const original = createSessionToken('admin@example.test');
  const refreshed = createSessionToken('admin@example.test', getSessionId(original));
  const separate = createSessionToken('admin@example.test');
  assert.equal(await isSessionActive(original), true);
  await revokeSession(refreshed);
  assert.equal(await isSessionActive(original), false);
  assert.equal(await isSessionActive(refreshed), false);
  assert.equal(await isSessionActive(separate), true);
});

test('admin auth fails closed if revocation storage is unavailable', async () => {
  Object.defineProperty(db, 'siteSetting', { configurable: true, value: { findUnique: async () => { throw Error('synthetic outage'); } } });
  const result = await requireAdmin(request('admin/properties', { cookie: `he_session=${createSessionToken('admin@example.test')}` }));
  assert.equal(result?.status, 503);
});

test('unauthenticated admin access is rejected', async () => {
  assert.equal((await requireAdmin(request('admin/properties')))?.status, 401);
});

test('private location and internal metadata do not reach public responses', () => {
  const input = { id: 'property', title: 'Example estate', publicLocationPrecise: false, address: 'PRIVATE ADDRESS', latitude: 32, longitude: 77, priceMinor: BigInt(100), priceMaxMinor: null, verificationSource: 'PRIVATE SOURCE', assignedAgentId: 'private-user', attributes: { secret: true }, media: [{ id: 'approved', moderationState: 'APPROVED', checksum: 'PRIVATE CHECKSUM' }, { id: 'pending', moderationState: 'PENDING' }] } as unknown as Property & { media: PropertyMedia[] };
  const result = publicProperty(input);
  assert.equal(result.address, null);
  assert.equal(result.latitude, null);
  assert.equal(result.longitude, null);
  assert.equal('verificationSource' in result, false);
  assert.equal('assignedAgentId' in result, false);
  assert.equal('attributes' in result, false);
  assert.equal(result.media.length, 1);
  assert.equal('checksum' in result.media[0], false);
  assert.equal(result.priceMinor, '100');
  assert.equal(publicProperty({ ...input, publicLocationPrecise: true }).address, 'PRIVATE ADDRESS');
});

test('generic property edit cannot publish a listing', () => {
  const valid = { title: 'Example estate', category: 'HOTEL', purpose: 'SALE', description: 'A sufficiently detailed estate description.', priceMode: 'FIXED', locality: 'Old Manali' };
  assert.equal(propertyInputSchema.safeParse(valid).success, true);
  assert.equal(propertyInputSchema.safeParse({ ...valid, status: 'PUBLISHED' }).success, false);
});

test('public settings have an allowlist and auth records are reserved', () => {
  assert.equal(PUBLIC_SETTING_KEYS.includes('contact.email'), true);
  assert.equal((PUBLIC_SETTING_KEYS as readonly string[]).includes('auth.revoked.synthetic'), false);
  assert.equal(settingSchema.safeParse({ settingKey: 'auth.revoked.synthetic', value: null }).success, false);
});

test('foreign browser origins cannot mutate admin or auth endpoints', () => {
  for (const path of ['admin/properties', 'auth/refresh', 'auth/sign-out']) {
    assert.equal(middleware(request(path, { origin: 'https://attacker.example' }, 'POST')).status, 403);
  }
  assert.equal(middleware(request('admin/properties', { origin: 'http://localhost:3000' }, 'POST')).status, 200);
  assert.equal(middleware(request('admin/properties', {}, 'POST')).status, 200);
});

test('spoofed forwarding headers cannot reset the default rate limit', () => {
  const namespace = `regression-${Date.now()}`;
  assert.equal(enforceRateLimit(request('auth/sign-in', { 'x-forwarded-for': '1.2.3.4' }), namespace, 1, 60000), null);
  assert.equal(enforceRateLimit(request('auth/sign-in', { 'x-forwarded-for': '5.6.7.8' }), namespace, 1, 60000)?.status, 429);
});
