import { NextRequest } from 'next/server';
import { z } from 'zod';
import { MediaType, MediaModerationState } from '@prisma/client';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { serializeForJson } from '@/lib/serialize';

type Context = { params: Promise<{ id: string }> };
const mediaSchema = z.object({ cloudinaryPublicId: z.string().trim().min(1).max(300), deliveryUrl: z.string().url().max(2000), mediaType: z.nativeEnum(MediaType).default('IMAGE'), displayOrder: z.number().int().nonnegative().default(0), caption: z.string().trim().max(300).optional().nullable(), altText: z.string().trim().min(2).max(200), isCover: z.boolean().default(false), checksum: z.string().trim().max(200).optional().nullable(), width: z.number().int().positive().optional().nullable(), height: z.number().int().positive().optional().nullable(), moderationState: z.nativeEnum(MediaModerationState).default('PENDING') });

export async function POST(request: NextRequest, { params }: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  if (!(await db.property.findUnique({ where: { id }, select: { id: true } }))) return apiError(404, 'PROPERTY_NOT_FOUND', 'Listing not found.');
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = mediaSchema.safeParse(body);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the media fields.', parsed.error.flatten().fieldErrors);
  try {
    const media = await db.$transaction(async (tx) => {
      if (parsed.data.isCover) await tx.propertyMedia.updateMany({ where: { propertyId: id }, data: { isCover: false } });
      return tx.propertyMedia.create({ data: { ...parsed.data, propertyId: id } });
    });
    return apiSuccess({ media: serializeForJson(media) }, { status: 201 });
  } catch (error) {
    console.error('admin.media.create_failed', error);
    return apiError(500, 'INTERNAL_ERROR', 'Media could not be attached.');
  }
}
