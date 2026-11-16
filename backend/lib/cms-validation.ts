import { z } from 'zod';
import { ContentStatus, CrmActivityType, CrmTaskStatus } from '@prisma/client';

export const pageSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(180),
  status: z.nativeEnum(ContentStatus).optional(),
  sections: z.record(z.string(), z.unknown()),
  seoTitle: z.string().trim().max(180).optional().nullable(),
  seoDescription: z.string().trim().max(320).optional().nullable(),
});

export const contentSchema = z.object({
  contentKey: z.string().trim().min(1).max(160).regex(/^[a-z0-9._-]+$/),
  value: z.unknown(),
  status: z.nativeEnum(ContentStatus).optional(),
});

export const settingSchema = z.object({ settingKey: z.string().trim().min(1).max(160).regex(/^[a-z0-9._-]+$/).refine(key => !key.startsWith('auth.'), 'Authentication settings are reserved.'), value: z.unknown() });

export const activitySchema = z.object({ type: z.nativeEnum(CrmActivityType), body: z.string().trim().min(1).max(5000), metadata: z.record(z.string(), z.unknown()).optional().nullable() });

export const taskSchema = z.object({ inquiryId: z.string().cuid().optional().nullable(), propertyId: z.string().cuid().optional().nullable(), title: z.string().trim().min(1).max(200), notes: z.string().trim().max(5000).optional().nullable(), status: z.nativeEnum(CrmTaskStatus).optional(), dueAt: z.string().datetime().optional().nullable() }).superRefine((value, context) => {
  if (!value.inquiryId && !value.propertyId) context.addIssue({ code: z.ZodIssueCode.custom, path: ['inquiryId'], message: 'A task must belong to an inquiry or property.' });
});

export const taskUpdateSchema = z.object({ title: z.string().trim().min(1).max(200).optional(), notes: z.string().trim().max(5000).optional().nullable(), status: z.nativeEnum(CrmTaskStatus).optional(), dueAt: z.string().datetime().optional().nullable() }).strict();
