import { ListingStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api';
import { db } from '@/lib/db';
import { publicProperty } from '@/lib/public-property';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const property = await db.property.findFirst({ where: { slug, status: ListingStatus.PUBLISHED, deletedAt: null }, include: { media: { where: { moderationState: 'APPROVED' }, orderBy: { displayOrder: 'asc' } }, assignedAgent: { select: { id: true, name: true, phone: true } } } });
    if (!property) return apiError(404, 'PROPERTY_NOT_FOUND', 'That property is no longer available.');
    return apiSuccess({ property: publicProperty(property) });
  } catch (error) {
    console.error('property.detail_failed', error);
    return apiError(500, 'INTERNAL_ERROR', 'Property could not be loaded.');
  }
}
