import { NextRequest } from 'next/server';
import { ListingStatus, Prisma } from '@prisma/client';
import { apiError, apiSuccess, parsePositiveInt } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { propertyCreateData, propertyInputSchema } from '@/lib/property-validation';
import { serializeForJson } from '@/lib/serialize';

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const params = request.nextUrl.searchParams;
  const page = parsePositiveInt(params.get('page'), 1, 10000);
  const pageSize = parsePositiveInt(params.get('pageSize'), 25, 100);
  const status = params.get('status')?.toUpperCase() as ListingStatus | undefined;
  if (status && !Object.values(ListingStatus).includes(status)) return apiError(400, 'INVALID_STATUS', 'Unknown listing status.');
  const search = params.get('q')?.trim();
  const where: Prisma.PropertyWhereInput = { deletedAt: null, ...(status ? { status } : {}), ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { slug: { contains: search, mode: 'insensitive' } }, { locality: { contains: search, mode: 'insensitive' } }] } : {}) };
  try {
    const [items, total] = await db.$transaction([
      db.property.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { media: { orderBy: { displayOrder: 'asc' } }, assignedAgent: { select: { id: true, name: true, email: true } } } }),
      db.property.count({ where }),
    ]);
    return apiSuccess(serializeForJson({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }));
  } catch (error) {
    console.error('admin.properties.list_failed', error);
    return apiError(500, 'INTERNAL_ERROR', 'Properties could not be loaded.');
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = propertyInputSchema.safeParse(body);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the listing fields.', parsed.error.flatten().fieldErrors);
  try {
    const property = await db.property.create({ data: propertyCreateData(parsed.data) as Prisma.PropertyUncheckedCreateInput });
    return apiSuccess({ property: serializeForJson(property) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return apiError(409, 'SLUG_ALREADY_EXISTS', 'A listing with this slug already exists.');
    console.error('admin.properties.create_failed', error);
    return apiError(500, 'INTERNAL_ERROR', 'The listing could not be created.');
  }
}
