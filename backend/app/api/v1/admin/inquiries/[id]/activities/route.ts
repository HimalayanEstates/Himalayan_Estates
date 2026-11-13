import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { activitySchema } from '@/lib/cms-validation';
import { serializeForJson } from '@/lib/serialize';

type Context = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const activities = await db.inquiryActivity.findMany({ where: { inquiryId: params.id }, orderBy: { createdAt: 'desc' } });
  return apiSuccess({ activities: serializeForJson(activities) });
}

export async function POST(request: NextRequest, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!(await db.inquiry.findUnique({ where: { id: params.id }, select: { id: true } }))) return apiError(404, 'INQUIRY_NOT_FOUND', 'Inquiry not found.');
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the activity fields.', parsed.error.flatten().fieldErrors);
  const activity = await db.inquiryActivity.create({ data: { ...parsed.data, metadata: parsed.data.metadata === null ? Prisma.JsonNull : parsed.data.metadata as Prisma.InputJsonValue, inquiryId: params.id } });
  return apiSuccess({ activity: serializeForJson(activity) }, { status: 201 });
}
