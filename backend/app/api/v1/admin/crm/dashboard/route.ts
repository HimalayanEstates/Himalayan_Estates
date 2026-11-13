import { NextRequest } from 'next/server';
import { CrmTaskStatus, ListingStatus } from '@prisma/client';
import { apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const now = new Date();
  const [inquiries, publishedProperties, openTasks, dueTasks, recentInquiries] = await Promise.all([
    db.inquiry.groupBy({ by: ['status'], _count: { _all: true } }),
    db.property.count({ where: { status: ListingStatus.PUBLISHED, deletedAt: null } }),
    db.crmTask.count({ where: { status: CrmTaskStatus.OPEN } }),
    db.crmTask.count({ where: { status: CrmTaskStatus.OPEN, dueAt: { lte: now } } }),
    db.inquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { property: { select: { title: true, slug: true } } } }),
  ]);
  return apiSuccess({ metrics: { publishedProperties, openTasks, dueTasks }, inquiryCounts: Object.fromEntries(inquiries.map((item) => [item.status, item._count._all])), recentInquiries });
}
