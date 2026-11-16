import { NextRequest } from 'next/server';
import { InquiryStatus, Prisma } from '@prisma/client';
import { apiError, apiSuccess, parsePositiveInt } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { serializeForJson } from '@/lib/serialize';

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const params = request.nextUrl.searchParams;
  const page = parsePositiveInt(params.get('page'), 1, 10000);
  const pageSize = parsePositiveInt(params.get('pageSize'), 25, 100);
  const status = params.get('status')?.toUpperCase() as InquiryStatus | undefined;
  if (status && !Object.values(InquiryStatus).includes(status)) return apiError(400, 'INVALID_STATUS', 'Unknown inquiry status.');
  const where: Prisma.InquiryWhereInput = status ? { status } : {};
  const [items, total] = await db.$transaction([
    db.inquiry.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { property: { select: { id: true, title: true, slug: true } }, assignedAgent: { select: { id: true, name: true, email: true } } } }),
    db.inquiry.count({ where }),
  ]);
  return apiSuccess(serializeForJson({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }));
}
