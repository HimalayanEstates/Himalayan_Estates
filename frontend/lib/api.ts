export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');

export type ApiMedia = {
  deliveryUrl: string;
  altText: string;
  isCover: boolean;
  moderationState: string;
};

export type ApiProperty = {
  id: string;
  slug: string;
  title: string;
  category: string;
  purpose: string;
  description: string;
  priceMode: string;
  priceMinor: string | null;
  priceMaxMinor: string | null;
  currency: string;
  areaValue: number | string | null;
  areaUnit: string | null;
  locality: string;
  city: string;
  amenities: string[];
  verificationStatus: string;
  media?: ApiMedia[];
};

export type PropertyListResponse = {
  items: ApiProperty[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number; hasMore?: boolean };
};

export function formatPrice(property: Pick<ApiProperty, 'priceMinor' | 'priceMaxMinor' | 'priceMode' | 'currency'>) {
  if (property.priceMode === 'PRICE_ON_REQUEST' || !property.priceMinor) return 'Price on request';
  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: property.currency || 'INR', maximumFractionDigits: 0 });
  const minimum = formatter.format(Number(property.priceMinor) / 100);
  if (property.priceMaxMinor) return `${minimum} – ${formatter.format(Number(property.priceMaxMinor) / 100)}`;
  return minimum;
}

export function formatPropertyType(category: string) {
  return category.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatPropertyMeta(property: ApiProperty) {
  const area = property.areaValue && property.areaUnit ? `${property.areaValue} ${property.areaUnit}` : null;
  return [area, ...property.amenities.slice(0, 2)].filter(Boolean).join(' · ') || 'Manali opportunity';
}

export async function fetchProperties(search = '') {
  const response = await fetch(`${API_BASE_URL}/properties${search ? `?${search}` : ''}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Properties could not be loaded.');
  return response.json() as Promise<PropertyListResponse>;
}

export async function fetchProperty(slug: string) {
  const response = await fetch(`${API_BASE_URL}/properties/${encodeURIComponent(slug)}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(response.status === 404 ? 'Property not found.' : 'Property could not be loaded.');
  return response.json() as Promise<{ property: ApiProperty }>;
}
