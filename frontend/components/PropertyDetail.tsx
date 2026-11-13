'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Compass, Heart, MapPin, ShieldCheck } from 'lucide-react';
import { ApiProperty, fetchProperty, formatPrice, formatPropertyMeta, formatPropertyType } from '@/lib/api';

const fallbackImage = 'https://images.unsplash.com/photo-1544986581-efac024faf62?auto=format&fit=crop&w=1800&q=90';

export default function PropertyDetail({ slug }: { slug: string }) {
  const [property, setProperty] = useState<ApiProperty | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProperty(slug).then((response) => setProperty(response.property)).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Property could not be loaded.'));
  }, [slug]);

  if (error) return <main className="detail-page"><div className="empty-state"><Compass size={28} /><h1>{error}</h1><a className="dark-button" href="/#properties">Back to collection</a></div></main>;
  if (!property) return <main className="detail-page"><div className="empty-state"><Compass size={28} /><h1>Finding this place…</h1><p>Loading the latest listing details.</p></div></main>;

  const cover = property.media?.find((media) => media.isCover && media.moderationState === 'APPROVED') ?? property.media?.[0];
  const facts = [formatPropertyMeta(property), ...property.amenities.slice(0, 3)].filter(Boolean);

  return (
    <main className="detail-page">
      <header className="detail-header"><a className="detail-back" href="/#properties"><ArrowLeft size={17} /> Back to collection</a><a className="detail-brand" href="/">Himalayan <em>Estates</em></a><button className="detail-save" type="button" aria-label={`Save ${property.title}`}><Heart size={18} /></button></header>
      <div className="detail-layout">
        <div className="detail-visual"><img src={cover?.deliveryUrl ?? fallbackImage} alt={cover?.altText ?? `${property.title}, ${formatPropertyType(property.category)}`} width="1800" height="1200" /><div className="detail-image-note"><span>H.E. / 2026</span><span>Curated opportunity</span></div></div>
        <article className="detail-copy"><div className="detail-kicker"><span className="verified-mark">{property.verificationStatus === 'VERIFIED' && <><ShieldCheck size={15} /> Verified opportunity</>}</span><span>{formatPropertyType(property.category)}</span></div><h1>{property.title}</h1><p className="detail-location"><MapPin size={15} />{property.locality}, {property.city}</p><p className="detail-summary">{property.description}</p><div className="detail-price"><span>Guide price</span><strong>{formatPrice(property)}</strong><small>Broker-assisted enquiry</small></div><div className="detail-facts">{facts.map((fact) => <div key={fact}><Check size={15} />{fact}</div>)}</div><div className="detail-rule" /><p className="detail-description">{property.description}</p><a className="dark-button detail-cta" href="/#contact">Request the full brief <ArrowUpRight size={17} /></a><p className="detail-note">A Himalayan Estates representative will share title, access and operating details after a short introduction.</p></article>
      </div>
      <footer className="detail-footer"><a href="/">Himalayan Estates</a><span>Places with a point of view.</span><a href="/#contact">Talk to a representative <ArrowUpRight size={15} /></a></footer>
    </main>
  );
}
