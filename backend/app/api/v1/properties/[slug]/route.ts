import { ListingStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const property = await db.property.findFirst({ where: { slug: params.slug, status: ListingStatus.PUBLISHED, deletedAt: null }, include: { media: { where: { moderationState: 'APPROVED' }, orderBy: { displayOrder: 'asc' } }, assignedAgent: { select: { id: true, name: true, phone: true } } } });
    if (!property) return apiError(404, 'PROPERTY_NOT_FOUND', 'That property is no longer available.');
    return apiSuccess({ property: { ...property, priceMinor: property.priceMinor?.toString() ?? null, priceMaxMinor: property.priceMaxMinor?.toString() ?? null, latitude: property.publicLocationPrecise ? property.latitude : null, longitude: property.publicLocationPrecise ? property.longitude : null } });
  } catch (error) {
    console.error('property.detail_failed', error);
    return apiError(500, 'INTERNAL_ERROR', 'Property could not be loaded.');
  }
}
