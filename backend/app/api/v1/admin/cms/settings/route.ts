import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { settingSchema } from '@/lib/cms-validation';
import { serializeForJson } from '@/lib/serialize';
import { revalidateTag } from 'next/cache';

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const settings = await db.siteSetting.findMany({ where: { NOT: { settingKey: { startsWith: 'auth.' } } }, orderBy: { settingKey: 'asc' } });
  return apiSuccess({ settings: serializeForJson(settings) });
}

export async function PUT(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = settingSchema.safeParse(body);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the setting fields.', parsed.error.flatten().fieldErrors);
  const value = parsed.data.value === null ? Prisma.JsonNull : parsed.data.value as Prisma.InputJsonValue;
  const setting = await db.siteSetting.upsert({ where: { settingKey: parsed.data.settingKey }, update: { value }, create: { settingKey: parsed.data.settingKey, value } });
  revalidateTag('public-settings');
  return apiSuccess({ setting: serializeForJson(setting) });
}
