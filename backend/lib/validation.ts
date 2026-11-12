import { z } from 'zod';

export const inquirySchema = z.object({
  propertyId: z.string().cuid().optional(),
  requesterName: z.string().trim().min(2).max(100),
  email: z.string().email().max(200).optional().or(z.literal('')),
  phone: z.string().trim().min(7).max(30).optional().or(z.literal('')),
  preferredContact: z.enum(['PHONE', 'EMAIL', 'WHATSAPP']),
  message: z.string().trim().min(10).max(2000),
  visitPreference: z.string().trim().max(200).optional(),
  consent: z.literal(true),
  source: z.string().trim().max(100).optional(),
  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(100).optional(),
}).superRefine((value, context) => {
  if (!value.email && !value.phone) context.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: 'Email or phone is required.' });
});
