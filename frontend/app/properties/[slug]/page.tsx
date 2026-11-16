import type { Metadata } from 'next';
import PropertyDetail from '@/components/PropertyDetail';

export const metadata: Metadata = {
  title: 'Property | Himalayan Estates',
  description: 'Explore a curated Manali property opportunity with Himalayan Estates.',
};

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PropertyDetail slug={slug} />;
}
