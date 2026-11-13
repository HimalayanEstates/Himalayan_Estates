import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { taskUpdateSchema } from '@/lib/cms-validation';
import { serializeForJson } from '@/lib/serialize';

type Context = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  const parsed = taskUpdateSchema.safeParse(body);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Please correct the task fields.', parsed.error.flatten().fieldErrors);
  if (!(await db.crmTask.findUnique({ where: { id: params.id }, select: { id: true } }))) return apiError(404, 'TASK_NOT_FOUND', 'CRM task not found.');
  const completed = parsed.data.status === 'COMPLETED';
  const task = await db.crmTask.update({ where: { id: params.id }, data: { ...parsed.data, dueAt: parsed.data.dueAt === undefined ? undefined : parsed.data.dueAt ? new Date(parsed.data.dueAt) : null, completedAt: completed ? new Date() : parsed.data.status ? null : undefined } });
  return apiSuccess({ task: serializeForJson(task) });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!(await db.crmTask.findUnique({ where: { id: params.id }, select: { id: true } }))) return apiError(404, 'TASK_NOT_FOUND', 'CRM task not found.');
  await db.crmTask.delete({ where: { id: params.id } });
  return apiSuccess({ deleted: true });
}
