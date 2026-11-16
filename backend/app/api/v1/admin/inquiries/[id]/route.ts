import { NextRequest } from 'next/server';
import { z } from 'zod';
import { InquiryStatus } from '@prisma/client';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { recordAudit } from '@/lib/audit';
import { db } from '@/lib/db';
import { serializeForJson } from '@/lib/serialize';

type Context = { params: Promise<{ id: string }> };
const updateSchema = z.object({ status: z.nativeEnum(InquiryStatus).optional(), assignedAgentId: z.string().cuid().nullable().optional(), nextFollowUpAt: z.string().datetime().nullable().optional(), internalNotes: z.string().trim().max(5000).nullable().optional() }).strict();

export async function GET(request: NextRequest, { params }: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const inquiry = await db.inquiry.findUnique({ where: { id }, include: { property: true, assignedAgent: { select: { id: true, name: true, email: true, phone: true } } } });
  if (!inquiry) return apiError(404, 'INQUIRY_NOT_FOUND', 'Inquiry not found.');
  return apiSuccess({ inquiry: serializeForJson(inquiry) });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the inquiry fields.', parsed.error.flatten().fieldErrors);
  const inquiry = await db.inquiry.findUnique({ where: { id } });
  if (!inquiry) return apiError(404, 'INQUIRY_NOT_FOUND', 'Inquiry not found.');
  const updated = await db.inquiry.update({ where: { id }, data: { ...parsed.data, nextFollowUpAt: parsed.data.nextFollowUpAt === undefined || parsed.data.nextFollowUpAt === null ? parsed.data.nextFollowUpAt : new Date(parsed.data.nextFollowUpAt) } });
  await recordAudit(db, { action: 'inquiry.updated', entityType: 'Inquiry', entityId: inquiry.id, propertyId: inquiry.propertyId ?? undefined, before: serializeForJson(inquiry), after: serializeForJson(updated) });
  return apiSuccess({ inquiry: serializeForJson(updated) });
}
