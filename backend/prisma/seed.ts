import { PrismaClient, ListingStatus, PricingMode, PropertyCategory, PropertyPurpose, VerificationStatus } from '@prisma/client';

const db = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL },
  },
});
const properties = [
  { slug: 'the-cedar-house', title: 'The Cedar House', category: PropertyCategory.HOTEL, purpose: PropertyPurpose.SALE, description: 'A twelve-key mountain stay above the Old Manali road.', priceMinor: BigInt(48500000), locality: 'Old Manali', city: 'Manali', region: 'Himachal Pradesh', areaValue: 1.8, areaUnit: 'acres', amenities: ['Forest views', 'Restaurant', 'Parking'], verificationStatus: VerificationStatus.VERIFIED },
  { slug: 'pine-river-parcel', title: 'Pine & River Parcel', category: PropertyCategory.LAND, purpose: PropertyPurpose.SALE, description: 'A clear-approach riverfront parcel near Solang Valley.', priceMinor: BigInt(16200000), locality: 'Solang Valley', city: 'Manali', region: 'Himachal Pradesh', areaValue: 18400, areaUnit: 'sq ft', amenities: ['River frontage', 'Road access'], verificationStatus: VerificationStatus.VERIFIED },
  { slug: 'the-orchard-room', title: 'The Orchard Room', category: PropertyCategory.HOUSE_VILLA, purpose: PropertyPurpose.SALE, description: 'A furnished three-bedroom home looking through old apple trees.', priceMinor: BigInt(21800000), locality: 'Naggar Road', city: 'Manali', region: 'Himachal Pradesh', areaValue: 2400, areaUnit: 'sq ft', amenities: ['Private garden', 'Valley view', 'Furnished'], verificationStatus: VerificationStatus.UNVERIFIED },
];

async function main() {
  for (const property of properties) await db.property.upsert({ where: { slug: property.slug }, update: { ...property, status: ListingStatus.PUBLISHED, publishedAt: new Date() }, create: { ...property, status: ListingStatus.PUBLISHED, priceMode: PricingMode.FIXED, publishedAt: new Date() } });
  console.log(`Seeded ${properties.length} properties.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
