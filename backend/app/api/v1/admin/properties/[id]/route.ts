import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { recordAudit } from '@/lib/audit';
import { db } from '@/lib/db';
import { propertyInputSchema, propertyUpdateData } from '@/lib/property-validation';
import { serializeForJson } from '@/lib/serialize';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const property = await db.property.findUnique({ where: { id }, include: { media: { orderBy: { displayOrder: 'asc' } }, assignedAgent: { select: { id: true, name: true, email: true, phone: true } } } });
  if (!property) return apiError(404, 'PROPERTY_NOT_FOUND', 'Listing not found.');
  return apiSuccess({ property: serializeForJson(property) });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = propertyInputSchema.safeParse(body);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the listing fields.', parsed.error.flatten().fieldErrors);
  const before = await db.property.findUnique({ where: { id } });
  if (!before) return apiError(404, 'PROPERTY_NOT_FOUND', 'Listing not found.');
  try {
    const property = await db.property.update({ where: { id }, data: propertyUpdateData(parsed.data) as Prisma.PropertyUncheckedUpdateInput });
    await recordAudit(db, { action: 'property.updated', entityType: 'Property', entityId: property.id, propertyId: property.id, before: serializeForJson(before), after: serializeForJson(property) });
    return apiSuccess({ property: serializeForJson(property) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return apiError(409, 'SLUG_ALREADY_EXISTS', 'A listing with this slug already exists.');
    console.error('admin.properties.update_failed', error);
    return apiError(500, 'INTERNAL_ERROR', 'The listing could not be updated.');
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const property = await db.property.findUnique({ where: { id } });
  if (!property) return apiError(404, 'PROPERTY_NOT_FOUND', 'Listing not found.');
  const archived = await db.property.update({ where: { id }, data: { status: 'ARCHIVED', deletedAt: new Date() } });
  await recordAudit(db, { action: 'property.archived', entityType: 'Property', entityId: property.id, propertyId: property.id, before: serializeForJson(property), after: serializeForJson(archived) });
  return apiSuccess({ property: serializeForJson(archived) });
}
