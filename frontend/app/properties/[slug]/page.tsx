import type { Metadata } from 'next';
import PropertyDetail from '@/components/PropertyDetail';

export const metadata: Metadata = {
  title: 'Property | Himalayan Estates',
  description: 'Explore a curated Manali property opportunity with Himalayan Estates.',
};

export default function PropertyDetailPage({ params }: { params: { slug: string } }) {
  return <PropertyDetail slug={params.slug} />;
}
