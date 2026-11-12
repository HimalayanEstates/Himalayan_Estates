import { ListingStatus, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api';
import { db } from '@/lib/db';
import { inquirySchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const idempotencyKey = request.headers.get('idempotency-key')?.trim();
  if (!idempotencyKey || idempotencyKey.length > 120) return apiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Provide a valid Idempotency-Key header.');

  let input: unknown;
  try { input = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', parsed.error.flatten().fieldErrors);

  const data = parsed.data;
  try {
    const existing = await db.inquiry.findUnique({ where: { idempotencyKey } });
    if (existing) return apiSuccess({ inquiry: { id: existing.id, status: existing.status }, duplicate: true });
    const property = data.propertyId ? await db.property.findFirst({ where: { id: data.propertyId, status: ListingStatus.PUBLISHED, deletedAt: null }, select: { id: true, title: true, slug: true, locality: true, city: true, priceMinor: true } }) : null;
    if (data.propertyId && !property) return apiError(404, 'PROPERTY_NOT_FOUND', 'That property is no longer available.');
    let inquiry;
    try {
      inquiry = await db.inquiry.create({ data: { propertyId: property?.id, requesterName: data.requesterName, email: data.email || null, phone: data.phone || null, preferredContact: data.preferredContact, message: data.message, visitPreference: data.visitPreference, consentAt: new Date(), source: data.source, utmSource: data.utmSource, utmMedium: data.utmMedium, utmCampaign: data.utmCampaign, idempotencyKey, listingSnapshot: property ? { title: property.title, slug: property.slug, locality: property.locality, city: property.city, priceMinor: property.priceMinor?.toString() ?? null } : undefined } });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      const duplicate = await db.inquiry.findUnique({ where: { idempotencyKey }, select: { id: true, status: true } });
      if (!duplicate) throw error;
      return apiSuccess({ inquiry: duplicate, duplicate: true });
    }
    return apiSuccess({ inquiry: { id: inquiry.id, status: inquiry.status } }, { status: 201 });
  } catch (error) {
    console.error('inquiry.create_failed', error);
    return apiError(500, 'INTERNAL_ERROR', 'Your inquiry could not be submitted. Please try again.');
  }
}
