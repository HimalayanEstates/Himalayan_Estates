import { PropertyCategory, PropertyPurpose, ListingStatus, VerificationStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { apiError, apiSuccess, parsePositiveInt } from '@/lib/api';
import { db } from '@/lib/db';

const categoryValues = new Set(Object.values(PropertyCategory));
const purposeValues = new Set(Object.values(PropertyPurpose));

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = parsePositiveInt(params.get('page'), 1, 10000);
  const pageSize = parsePositiveInt(params.get('pageSize'), 12, 48);
  const category = params.get('category')?.toUpperCase();
  const purpose = params.get('purpose')?.toUpperCase();
  const verified = params.get('verified') === 'true';
  const minPrice = Number(params.get('minPrice'));
  const maxPrice = Number(params.get('maxPrice'));
  const query = params.get('q')?.trim();
  const city = params.get('city')?.trim();
  const locality = params.get('locality')?.trim();

  if (category && !categoryValues.has(category as PropertyCategory)) return apiError(400, 'INVALID_CATEGORY', 'Unknown property category.');
  if (purpose && !purposeValues.has(purpose as PropertyPurpose)) return apiError(400, 'INVALID_PURPOSE', 'Unknown property purpose.');

  const where = {
    status: ListingStatus.PUBLISHED,
    deletedAt: null,
    ...(category ? { category: category as PropertyCategory } : {}),
    ...(purpose ? { purpose: purpose as PropertyPurpose } : {}),
    ...(verified ? { verificationStatus: VerificationStatus.VERIFIED } : {}),
    ...(city ? { city: { contains: city, mode: 'insensitive' as const } } : {}),
    ...(locality ? { locality: { contains: locality, mode: 'insensitive' as const } } : {}),
    ...(query ? { OR: [{ title: { contains: query, mode: 'insensitive' as const } }, { description: { contains: query, mode: 'insensitive' as const } }, { locality: { contains: query, mode: 'insensitive' as const } }, { city: { contains: query, mode: 'insensitive' as const } }] } : {}),
    ...(!Number.isNaN(minPrice) || !Number.isNaN(maxPrice) ? { priceMinor: { ...(Number.isNaN(minPrice) ? {} : { gte: BigInt(minPrice) }), ...(Number.isNaN(maxPrice) ? {} : { lte: BigInt(maxPrice) }) } } : {}),
  };

  const sort = params.get('sort');
  const orderBy = sort === 'price_asc' ? { priceMinor: 'asc' as const } : sort === 'price_desc' ? { priceMinor: 'desc' as const } : { publishedAt: 'desc' as const };

  try {
    const [items, total] = await db.$transaction([
      db.property.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: { media: { where: { isCover: true, moderationState: 'APPROVED' }, take: 1 } } }),
      db.property.count({ where }),
    ]);

    return apiSuccess({ items: items.map((property) => ({ ...property, priceMinor: property.priceMinor?.toString() ?? null, priceMaxMinor: property.priceMaxMinor?.toString() ?? null, latitude: property.publicLocationPrecise ? property.latitude : null, longitude: property.publicLocationPrecise ? property.longitude : null })), pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasMore: page * pageSize < total }, filters: { q: query ?? null, category: category ?? null, purpose: purpose ?? null, city: city ?? null, locality: locality ?? null, verified } });
  } catch (error) {
    console.error('properties.list_failed', error);
    return apiError(500, 'INTERNAL_ERROR', 'Properties could not be loaded.');
  }
}
