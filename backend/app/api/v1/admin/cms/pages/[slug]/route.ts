import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { pageSchema } from '@/lib/cms-validation';
import { serializeForJson } from '@/lib/serialize';
import { revalidateTag } from 'next/cache';

type Context = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { slug } = await params;
  const page = await db.sitePage.findUnique({ where: { slug } });
  if (!page) return apiError(404, 'PAGE_NOT_FOUND', 'Page not found.');
  return apiSuccess({ page: serializeForJson(page) });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { slug } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = pageSchema.safeParse({ ...(body as object), slug });
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the page fields.', parsed.error.flatten().fieldErrors);
  const page = await db.sitePage.findUnique({ where: { slug } });
  if (!page) return apiError(404, 'PAGE_NOT_FOUND', 'Page not found.');
  const updated = await db.sitePage.update({ where: { slug }, data: { ...parsed.data, sections: parsed.data.sections as Prisma.InputJsonValue, status: 'DRAFT', publishedAt: null } });
  revalidateTag('public-pages');
  return apiSuccess({ page: serializeForJson(updated) });
}

export async function POST(request: NextRequest, { params }: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { slug } = await params;
  const action = request.nextUrl.searchParams.get('action');
  if (action !== 'publish' && action !== 'unpublish') return apiError(400, 'INVALID_ACTION', 'Use action=publish or action=unpublish.');
  const page = await db.sitePage.findUnique({ where: { slug } });
  if (!page) return apiError(404, 'PAGE_NOT_FOUND', 'Page not found.');
  const updated = await db.sitePage.update({ where: { slug }, data: { status: action === 'publish' ? 'PUBLISHED' : 'DRAFT', publishedAt: action === 'publish' ? new Date() : null } });
  revalidateTag('public-pages');
  return apiSuccess({ page: serializeForJson(updated) });
}
