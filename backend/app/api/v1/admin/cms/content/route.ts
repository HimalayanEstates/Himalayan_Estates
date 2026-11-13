import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { contentSchema } from '@/lib/cms-validation';
import { serializeForJson } from '@/lib/serialize';

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const content = await db.siteContent.findMany({ orderBy: { contentKey: 'asc' } });
  return apiSuccess({ content: serializeForJson(content) });
}

export async function PUT(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = contentSchema.safeParse(body);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the content fields.', parsed.error.flatten().fieldErrors);
  const value = parsed.data.value === null ? Prisma.JsonNull : parsed.data.value as Prisma.InputJsonValue;
  const content = await db.siteContent.upsert({ where: { contentKey: parsed.data.contentKey }, update: { value, status: 'DRAFT', publishedAt: null }, create: { contentKey: parsed.data.contentKey, value, status: 'DRAFT' } });
  return apiSuccess({ content: serializeForJson(content) });
}
