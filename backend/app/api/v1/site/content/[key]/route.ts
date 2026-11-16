import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api';
import { db } from '@/lib/db';
import { serializeForJson } from '@/lib/serialize';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const content = await db.siteContent.findFirst({ where: { contentKey: key, status: 'PUBLISHED' } });
  if (!content) return apiError(404, 'CONTENT_NOT_FOUND', 'Published content not found.');
  return apiSuccess({ content: serializeForJson(content) });
}
