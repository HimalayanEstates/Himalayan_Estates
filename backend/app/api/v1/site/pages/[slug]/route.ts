import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api';
import { db } from '@/lib/db';
import { serializeForJson } from '@/lib/serialize';

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  const page = await db.sitePage.findFirst({ where: { slug: params.slug, status: 'PUBLISHED' } });
  if (!page) return apiError(404, 'PAGE_NOT_FOUND', 'Published page not found.');
  return apiSuccess({ page: serializeForJson(page) });
}
