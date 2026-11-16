import type { Property, PropertyMedia } from '@prisma/client';

type PublicPropertyRecord = Pick<Property,
  | 'id' | 'slug' | 'title' | 'category' | 'purpose' | 'description' | 'priceMode'
  | 'priceMinor' | 'priceMaxMinor' | 'currency' | 'areaValue' | 'areaUnit'
  | 'locality' | 'city' | 'region' | 'address' | 'latitude' | 'longitude'
  | 'publicLocationPrecise' | 'amenities' | 'verificationStatus' | 'seoTitle' | 'seoDescription'
> & {
  media: Pick<PropertyMedia, 'id' | 'deliveryUrl' | 'mediaType' | 'altText' | 'caption' | 'isCover' | 'displayOrder' | 'moderationState'>[];
};

export function publicProperty(property: PublicPropertyRecord) {
  return {
    id: property.id, slug: property.slug, title: property.title,
    category: property.category, purpose: property.purpose, description: property.description,
    priceMode: property.priceMode, priceMinor: property.priceMinor?.toString() ?? null,
    priceMaxMinor: property.priceMaxMinor?.toString() ?? null, currency: property.currency,
    areaValue: property.areaValue, areaUnit: property.areaUnit,
    locality: property.locality, city: property.city, region: property.region,
    address: property.publicLocationPrecise ? property.address : null,
    latitude: property.publicLocationPrecise ? property.latitude : null,
    longitude: property.publicLocationPrecise ? property.longitude : null,
    publicLocationPrecise: property.publicLocationPrecise,
    amenities: property.amenities, verificationStatus: property.verificationStatus,
    seoTitle: property.seoTitle, seoDescription: property.seoDescription,
    media: property.media.filter(media => media.moderationState === 'APPROVED').map(media => ({
      id: media.id, deliveryUrl: media.deliveryUrl, mediaType: media.mediaType,
      altText: media.altText, caption: media.caption, isCover: media.isCover,
      displayOrder: media.displayOrder, moderationState: media.moderationState,
    })),
  };
}
