import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const now = new Date();
  const [summary, recentInquiries] = await Promise.all([
    db.$queryRaw<Array<{ publishedProperties: number; openTasks: number; dueTasks: number; inquiryCounts: Record<string, number> }>>`
      SELECT
        (SELECT COUNT(*)::int FROM "Property" WHERE status = 'PUBLISHED' AND "deletedAt" IS NULL) AS "publishedProperties",
        tasks."openTasks", tasks."dueTasks",
        (SELECT COALESCE(jsonb_object_agg(status, total), '{}'::jsonb)
         FROM (SELECT status, COUNT(*)::int AS total FROM "Inquiry" GROUP BY status) counts) AS "inquiryCounts"
      FROM (SELECT COUNT(*)::int AS "openTasks",
                   COUNT(*) FILTER (WHERE "dueAt" <= ${now})::int AS "dueTasks"
            FROM "CrmTask" WHERE status = 'OPEN') tasks
    `,
    db.inquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { property: { select: { title: true, slug: true } } } }),
  ]);
  const { publishedProperties, openTasks, dueTasks, inquiryCounts } = summary[0];
  return apiSuccess({ metrics: { publishedProperties, openTasks, dueTasks }, inquiryCounts, recentInquiries }, { headers: { 'Cache-Control': 'no-store' } });
}
