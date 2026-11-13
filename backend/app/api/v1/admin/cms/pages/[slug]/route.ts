import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { pageSchema } from '@/lib/cms-validation';
import { serializeForJson } from '@/lib/serialize';

type Context = { params: { slug: string } };

export async function GET(request: NextRequest, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const page = await db.sitePage.findUnique({ where: { slug: params.slug } });
  if (!page) return apiError(404, 'PAGE_NOT_FOUND', 'Page not found.');
  return apiSuccess({ page: serializeForJson(page) });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = pageSchema.safeParse({ ...(body as object), slug: params.slug });
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the page fields.', parsed.error.flatten().fieldErrors);
  const page = await db.sitePage.findUnique({ where: { slug: params.slug } });
  if (!page) return apiError(404, 'PAGE_NOT_FOUND', 'Page not found.');
  const updated = await db.sitePage.update({ where: { slug: params.slug }, data: { ...parsed.data, sections: parsed.data.sections as Prisma.InputJsonValue, status: 'DRAFT', publishedAt: null } });
  return apiSuccess({ page: serializeForJson(updated) });
}

export async function POST(request: NextRequest, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const action = request.nextUrl.searchParams.get('action');
  if (action !== 'publish' && action !== 'unpublish') return apiError(400, 'INVALID_ACTION', 'Use action=publish or action=unpublish.');
  const page = await db.sitePage.findUnique({ where: { slug: params.slug } });
  if (!page) return apiError(404, 'PAGE_NOT_FOUND', 'Page not found.');
  const updated = await db.sitePage.update({ where: { slug: params.slug }, data: { status: action === 'publish' ? 'PUBLISHED' : 'DRAFT', publishedAt: action === 'publish' ? new Date() : null } });
  return apiSuccess({ page: serializeForJson(updated) });
}
