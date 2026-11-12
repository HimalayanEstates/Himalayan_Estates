import { NextRequest } from 'next/server';
import { apiError, apiSuccess, parsePositiveInt } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { serializeForJson } from '@/lib/serialize';

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const params = request.nextUrl.searchParams;
  const page = parsePositiveInt(params.get('page'), 1, 10000);
  const pageSize = parsePositiveInt(params.get('pageSize'), 50, 100);
  const entityType = params.get('entityType')?.trim();
  const action = params.get('action')?.trim();
  try {
    const where = { ...(entityType ? { entityType } : {}), ...(action ? { action } : {}) };
    const [items, total] = await db.$transaction([
      db.auditEvent.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      db.auditEvent.count({ where }),
    ]);
    return apiSuccess(serializeForJson({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }));
  } catch (error) {
    console.error('admin.audit.list_failed', error);
    return apiError(500, 'INTERNAL_ERROR', 'Audit events could not be loaded.');
  }
}
