import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api';
import { db } from '@/lib/db';
import { serializeForJson } from '@/lib/serialize';
import { unstable_cache } from 'next/cache';

const publishedPage = unstable_cache(async (slug: string) => {
  return serializeForJson(await db.sitePage.findFirst({ where: { slug, status: 'PUBLISHED' } }));
}, ['public-pages'], { revalidate: 30, tags: ['public-pages'] });

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let page;
  try { page = await publishedPage(slug); }
  catch { return apiError(503, 'SERVICE_UNAVAILABLE', 'Page content is temporarily unavailable.'); }
  if (!page) return apiError(404, 'PAGE_NOT_FOUND', 'Published page not found.');
  return apiSuccess({ page: serializeForJson(page) }, { headers: { 'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=120' } });
}
