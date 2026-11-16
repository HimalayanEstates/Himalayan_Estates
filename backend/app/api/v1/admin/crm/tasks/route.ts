import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { taskSchema } from '@/lib/cms-validation';
import { serializeForJson } from '@/lib/serialize';

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const tasks = await db.crmTask.findMany({ orderBy: [{ status: 'asc' }, { dueAt: 'asc' }], include: { inquiry: { select: { id: true, requesterName: true, status: true } }, property: { select: { id: true, title: true, slug: true } } } });
  return apiSuccess({ tasks: serializeForJson(tasks) });
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the task fields.', parsed.error.flatten().fieldErrors);
  const task = await db.crmTask.create({ data: { ...parsed.data, dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null } });
  return apiSuccess({ task: serializeForJson(task) }, { status: 201 });
}
