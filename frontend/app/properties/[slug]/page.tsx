import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight, Check, Heart, MapPin, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';

type Listing = {
  slug: string;
  title: string;
  location: string;
  type: string;
  price: string;
  summary: string;
  image: string;
  facts: string[];
  description: string;
};

const listings: Listing[] = [
  {
    slug: 'the-cedar-house',
    title: 'The Cedar House',
    location: 'Old Manali, Himachal Pradesh',
    type: 'Boutique hotel',
    price: '₹4.85 Cr',
    summary: 'A twelve-key mountain stay with a quiet rhythm and room to grow.',
    image: 'https://images.unsplash.com/photo-1544986581-efac024faf62?auto=format&fit=crop&w=1800&q=90',
    facts: ['12 keys', '1.8 acres', 'Operating stay', 'Forest views'],
    description: 'Set above the old cantonment road, The Cedar House is the kind of hospitality asset guests return to for the silence. The existing rooms, common dining room and terraced garden are ready for a thoughtful next chapter.',
  },
  {
    slug: 'pine-river-parcel',
    title: 'Pine & River Parcel',
    location: 'Solang Valley, Manali',
    type: 'Riverfront land',
    price: '₹1.62 Cr',
    summary: 'A clear-approach parcel where the river does the welcome.',
    image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=90',
    facts: ['18,400 sq ft', 'River frontage', 'Clear approach', 'South-east light'],
    description: 'A rare stretch of land with an easy approach from the valley road and the sound of water across the meadow. Suited to a small retreat, private home or a considered collection of cabins, subject to local approvals.',
  },
  {
    slug: 'the-orchard-room',
    title: 'The Orchard Room',
    location: 'Naggar Road, Manali',
    type: 'Mountain home',
    price: '₹2.18 Cr',
    summary: 'A furnished three-bedroom home looking through old apple trees.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=90',
    facts: ['3 bedrooms', 'Furnished', 'Valley view', 'Private garden'],
    description: 'The Orchard Room is a warm, finished home for slow weekends or longer stays. Its open living room faces the valley, while the garden gives the bedrooms a sense of privacy that is increasingly hard to find.',
  },
];

function getListing(slug: string) {
  return listings.find((listing) => listing.slug === slug);
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const listing = getListing(params.slug);
  return listing ? { title: `${listing.title} | Himalayan Estates`, description: listing.summary } : { title: 'Property | Himalayan Estates' };
}

export default function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const listing = getListing(params.slug);
  if (!listing) notFound();

  return (
    <main className="detail-page">
      <header className="detail-header"><a className="detail-back" href="/#properties"><ArrowLeft size={17} /> Back to collection</a><a className="detail-brand" href="/">Himalayan <em>Estates</em></a><button className="detail-save" type="button" aria-label={`Save ${listing.title}`}><Heart size={18} /></button></header>
      <div className="detail-layout">
        <div className="detail-visual"><img src={listing.image} alt={`${listing.title}, ${listing.type}`} width="1800" height="1200" /><div className="detail-image-note"><span>H.E. / 2026</span><span>Curated opportunity</span></div></div>
        <article className="detail-copy"><div className="detail-kicker"><span className="verified-mark"><ShieldCheck size={15} /> Verified opportunity</span><span>{listing.type}</span></div><h1>{listing.title}</h1><p className="detail-location"><MapPin size={15} />{listing.location}</p><p className="detail-summary">{listing.summary}</p><div className="detail-price"><span>Guide price</span><strong>{listing.price}</strong><small>Broker-assisted enquiry</small></div><div className="detail-facts">{listing.facts.map((fact) => <div key={fact}><Check size={15} />{fact}</div>)}</div><div className="detail-rule" /><p className="detail-description">{listing.description}</p><a className="dark-button detail-cta" href="/#contact">Request the full brief <ArrowUpRight size={17} /></a><p className="detail-note">A Himalayan Estates broker will share title, access and operating details after a short introduction.</p></article>
      </div>
      <footer className="detail-footer"><a href="/">Himalayan Estates</a><span>Places with a point of view.</span><a href="/#contact">Talk to a broker <ArrowUpRight size={15} /></a></footer>
    </main>
  );
}
