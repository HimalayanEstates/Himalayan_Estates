import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { pageSchema } from '@/lib/cms-validation';
import { serializeForJson } from '@/lib/serialize';

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const pages = await db.sitePage.findMany({ orderBy: { updatedAt: 'desc' } });
  return apiSuccess({ pages: serializeForJson(pages) });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = pageSchema.safeParse(body);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the page fields.', parsed.error.flatten().fieldErrors);
  try {
    const page = await db.sitePage.create({ data: { ...parsed.data, sections: parsed.data.sections as Prisma.InputJsonValue, status: 'DRAFT' } });
    return apiSuccess({ page: serializeForJson(page) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return apiError(409, 'PAGE_EXISTS', 'A page with this slug already exists.');
    return apiError(500, 'INTERNAL_ERROR', 'The page could not be created.');
  }
}
