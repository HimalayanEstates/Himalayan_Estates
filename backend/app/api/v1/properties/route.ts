import { PropertyCategory, PropertyPurpose, ListingStatus, VerificationStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { apiError, apiSuccess, parseOptionalNonNegativeBigInt, parsePositiveInt } from '@/lib/api';
import { db } from '@/lib/db';
import { publicProperty } from '@/lib/public-property';
import { unstable_cache } from 'next/cache';
import { serializeForJson } from '@/lib/serialize';

const categoryValues = new Set(Object.values(PropertyCategory));
const purposeValues = new Set(Object.values(PropertyPurpose));

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = parsePositiveInt(params.get('page'), 1, 10000);
  const pageSize = parsePositiveInt(params.get('pageSize'), 12, 48);
  const category = params.get('category')?.toUpperCase();
  const purpose = params.get('purpose')?.toUpperCase();
  const verified = params.get('verified') === 'true';
  const minPrice = parseOptionalNonNegativeBigInt(params.get('minPrice'));
  const maxPrice = parseOptionalNonNegativeBigInt(params.get('maxPrice'));
  const query = params.get('q')?.trim();
  const city = params.get('city')?.trim();
  const locality = params.get('locality')?.trim();
  const includeTotal = params.get('includeTotal') !== 'false';

  if (category && !categoryValues.has(category as PropertyCategory)) return apiError(400, 'INVALID_CATEGORY', 'Unknown property category.');
  if (purpose && !purposeValues.has(purpose as PropertyPurpose)) return apiError(400, 'INVALID_PURPOSE', 'Unknown property purpose.');
  if (minPrice.error) return apiError(400, 'INVALID_MIN_PRICE', 'minPrice must be a non-negative integer.');
  if (maxPrice.error) return apiError(400, 'INVALID_MAX_PRICE', 'maxPrice must be a non-negative integer.');
  if (minPrice.value !== undefined && maxPrice.value !== undefined && minPrice.value > maxPrice.value) return apiError(400, 'INVALID_PRICE_RANGE', 'minPrice cannot exceed maxPrice.');

  const where = {
    status: ListingStatus.PUBLISHED,
    deletedAt: null,
    ...(category ? { category: category as PropertyCategory } : {}),
    ...(purpose ? { purpose: purpose as PropertyPurpose } : {}),
    ...(verified ? { verificationStatus: VerificationStatus.VERIFIED } : {}),
    ...(city ? { city: { contains: city, mode: 'insensitive' as const } } : {}),
    ...(locality ? { locality: { contains: locality, mode: 'insensitive' as const } } : {}),
    ...(query ? { OR: [{ title: { contains: query, mode: 'insensitive' as const } }, { description: { contains: query, mode: 'insensitive' as const } }, { locality: { contains: query, mode: 'insensitive' as const } }, { city: { contains: query, mode: 'insensitive' as const } }] } : {}),
    ...(minPrice.value !== undefined || maxPrice.value !== undefined ? { priceMinor: { ...(minPrice.value === undefined ? {} : { gte: minPrice.value }), ...(maxPrice.value === undefined ? {} : { lte: maxPrice.value }) } } : {}),
  };

  const sort = params.get('sort');
  const orderBy = sort === 'price_asc' ? { priceMinor: 'asc' as const } : sort === 'price_desc' ? { priceMinor: 'desc' as const } : { publishedAt: 'desc' as const };

  try {
    const load = unstable_cache(async () => serializeForJson(await Promise.all([
      db.property.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, slug: true, title: true, category: true, purpose: true, description: true,
          priceMode: true, priceMinor: true, priceMaxMinor: true, currency: true,
          areaValue: true, areaUnit: true, locality: true, city: true, region: true,
          address: true, latitude: true, longitude: true, publicLocationPrecise: true,
          amenities: true, verificationStatus: true, seoTitle: true, seoDescription: true,
          media: {
            where: { isCover: true, moderationState: 'APPROVED' },
            orderBy: { displayOrder: 'asc' },
            take: 1,
            select: { id: true, deliveryUrl: true, mediaType: true, altText: true, caption: true, isCover: true, displayOrder: true, moderationState: true },
          },
        },
      }),
      includeTotal ? db.property.count({ where }) : Promise.resolve(null),
    ])), ['public-properties', request.nextUrl.search], { revalidate: 10 });
    const [items, total] = await load();

    const visibleTotal = total ?? items.length;
    const totalPages = total === null ? 1 : Math.ceil(total / pageSize);
    const response = apiSuccess({ items: items.map(publicProperty), pagination: { page, pageSize, total: visibleTotal, totalPages, hasMore: total === null ? items.length === pageSize : page * pageSize < total }, filters: { q: query ?? null, category: category ?? null, purpose: purpose ?? null, city: city ?? null, locality: locality ?? null, verified } }, {
      headers: { 'Cache-Control': 'public, max-age=5, s-maxage=20, stale-while-revalidate=60' },
    });
    return response;
  } catch (error) {
    console.error('properties.list_failed', error);
    return apiError(500, 'INTERNAL_ERROR', 'Properties could not be loaded.');
  }
}
