import { Prisma, PrismaClient } from '@prisma/client';

export async function recordAudit(
  db: PrismaClient,
  input: { action: string; entityType: string; entityId: string; propertyId?: string; actorId?: string; before?: unknown; after?: unknown; reason?: string },
) {
  await db.auditEvent.create({ data: { ...input } as Prisma.AuditEventUncheckedCreateInput });
}
