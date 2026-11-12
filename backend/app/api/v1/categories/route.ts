import { PropertyCategory, PropertyPurpose } from '@prisma/client';
import { apiSuccess } from '@/lib/api';

export function GET() {
  return apiSuccess({ categories: Object.values(PropertyCategory), purposes: Object.values(PropertyPurpose), location: { city: 'Manali', region: 'Himachal Pradesh' } });
}
