import { NextRequest } from 'next/server';
import { ListingStatus } from '@prisma/client';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { recordAudit } from '@/lib/audit';
import { db } from '@/lib/db';
import { serializeForJson } from '@/lib/serialize';

type Context = { params: { id: string; action: string } };

export async function POST(request: NextRequest, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const property = await db.property.findUnique({ where: { id: params.id }, include: { media: true } });
  if (!property) return apiError(404, 'PROPERTY_NOT_FOUND', 'Listing not found.');

  const nextStatus: Record<string, ListingStatus> = { 'submit-review': 'IN_REVIEW', publish: 'PUBLISHED', pause: 'PAUSED', archive: 'ARCHIVED' };
  const status = nextStatus[params.action];
  if (!status) return apiError(404, 'ACTION_NOT_FOUND', 'Unknown listing action.');
  if (params.action === 'publish') {
    const hasCover = property.media.some((media) => media.isCover && media.moderationState === 'APPROVED');
    if (!hasCover) return apiError(422, 'COVER_IMAGE_REQUIRED', 'A published listing requires an approved cover image.');
    if (!property.title || !property.description || !property.locality || !property.category || !property.purpose) return apiError(422, 'LISTING_INCOMPLETE', 'Complete the required listing fields before publishing.');
  }
  const updated = await db.property.update({ where: { id: property.id }, data: { status, ...(status === 'PUBLISHED' ? { publishedAt: property.publishedAt ?? new Date() } : {}) } });
  await recordAudit(db, { action: `property.${params.action}`, entityType: 'Property', entityId: property.id, propertyId: property.id, before: serializeForJson(property), after: serializeForJson(updated) });
  return apiSuccess({ property: serializeForJson(updated) });
}
