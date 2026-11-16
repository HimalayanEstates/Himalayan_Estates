import { z } from 'zod';
import { PropertyCategory, PropertyPurpose, PricingMode, VerificationStatus } from '@prisma/client';

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

export const propertyInputSchema = z.object({
  slug: z.string().trim().min(3).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  title: z.string().trim().min(3).max(180),
  category: z.nativeEnum(PropertyCategory),
  purpose: z.nativeEnum(PropertyPurpose),
  status: z.never().optional(),
  description: z.string().trim().min(20).max(12000),
  priceMode: z.nativeEnum(PricingMode),
  priceMinor: z.string().regex(/^\d+$/).optional().nullable(),
  priceMaxMinor: z.string().regex(/^\d+$/).optional().nullable(),
  currency: z.string().trim().length(3).default('INR'),
  areaValue: z.number().finite().nonnegative().optional().nullable(),
  areaUnit: optionalText(30),
  address: optionalText(300),
  locality: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80).default('Manali'),
  region: optionalText(120),
  latitude: z.number().finite().min(-90).max(90).optional().nullable(),
  longitude: z.number().finite().min(-180).max(180).optional().nullable(),
  publicLocationPrecise: z.boolean().default(false),
  amenities: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
  seoTitle: optionalText(180),
  seoDescription: optionalText(320),
  verificationStatus: z.nativeEnum(VerificationStatus).optional(),
  verificationSource: optionalText(200),
  assignedAgentId: z.string().cuid().optional().nullable(),
}).superRefine((value, context) => {
  if (value.priceMode === 'RANGE' && !value.priceMaxMinor) context.addIssue({ code: z.ZodIssueCode.custom, path: ['priceMaxMinor'], message: 'A range requires a maximum price.' });
  if (value.priceMinor && value.priceMaxMinor && BigInt(value.priceMinor) > BigInt(value.priceMaxMinor)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['priceMaxMinor'], message: 'Maximum price cannot be below minimum price.' });
  if (value.publicLocationPrecise && (value.latitude === null || value.latitude === undefined || value.longitude === null || value.longitude === undefined)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['publicLocationPrecise'], message: 'Precise public location requires latitude and longitude.' });
  if (value.city.toLowerCase() !== 'manali') context.addIssue({ code: z.ZodIssueCode.custom, path: ['city'], message: 'Only Manali listings are supported.' });
});

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 150);
}

export function propertyCreateData(input: z.infer<typeof propertyInputSchema>) {
  return {
    ...input,
    slug: input.slug ?? slugify(input.title),
    priceMinor: input.priceMinor ? BigInt(input.priceMinor) : null,
    priceMaxMinor: input.priceMaxMinor ? BigInt(input.priceMaxMinor) : null,
    status: 'DRAFT' as const,
    verificationStatus: input.verificationStatus ?? ('UNVERIFIED' as const),
    verificationDate: input.verificationStatus === 'VERIFIED' ? new Date() : null,
  };
}

export function propertyUpdateData(input: z.infer<typeof propertyInputSchema>) {
  const { slug, ...rest } = input;
  return {
    ...rest,
    ...(slug ? { slug } : {}),
    priceMinor: rest.priceMinor ? BigInt(rest.priceMinor) : null,
    priceMaxMinor: rest.priceMaxMinor ? BigInt(rest.priceMaxMinor) : null,
    ...(rest.verificationStatus === 'VERIFIED' ? { verificationDate: new Date() } : {}),
  };
}
