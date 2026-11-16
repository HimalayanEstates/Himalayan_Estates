import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { serializeForJson } from '@/lib/serialize';

type Context = { params: Promise<{ id: string; mediaId: string }> };
const mediaUpdateSchema = z.object({ displayOrder: z.number().int().nonnegative().optional(), caption: z.string().trim().max(300).optional().nullable(), altText: z.string().trim().min(2).max(200).optional(), isCover: z.boolean().optional(), moderationState: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional() }).strict();

export async function PATCH(request: NextRequest, { params }: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id, mediaId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = mediaUpdateSchema.safeParse(body);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the media fields.', parsed.error.flatten().fieldErrors);
  const existing = await db.propertyMedia.findFirst({ where: { id: mediaId, propertyId: id } });
  if (!existing) return apiError(404, 'MEDIA_NOT_FOUND', 'Media not found.');
  const media = await db.$transaction(async (tx) => {
    if (parsed.data.isCover) await tx.propertyMedia.updateMany({ where: { propertyId: id }, data: { isCover: false } });
    return tx.propertyMedia.update({ where: { id: mediaId }, data: parsed.data });
  });
  return apiSuccess({ media: serializeForJson(media) });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id, mediaId } = await params;
  const existing = await db.propertyMedia.findFirst({ where: { id: mediaId, propertyId: id }, select: { id: true } });
  if (!existing) return apiError(404, 'MEDIA_NOT_FOUND', 'Media not found.');
  await db.propertyMedia.delete({ where: { id: mediaId } });
  return apiSuccess({ deleted: true });
}
