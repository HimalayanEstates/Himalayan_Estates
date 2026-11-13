'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  Compass,
  Heart,
  Hotel,
  LandPlot,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Trees,
  X,
} from 'lucide-react';
import { ApiProperty, fetchProperties, formatPrice, formatPropertyMeta, formatPropertyType } from '@/lib/api';

type Intent = 'buy' | 'lease' | 'stay';

type DisplayProperty = {
  slug: string;
  title: string;
  location: string;
  type: string;
  price: string;
  meta: string;
  image: string;
  featured?: boolean;
};

const fallbackImages = [
  'https://images.unsplash.com/photo-1544986581-efac024faf62?auto=format&fit=crop&w=1100&q=85',
  'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1100&q=85',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=85',
];

function toDisplayProperty(property: ApiProperty, index: number): DisplayProperty {
  const cover = property.media?.find((media) => media.isCover && media.moderationState === 'APPROVED') ?? property.media?.[0];
  return {
    slug: property.slug,
    title: property.title,
    location: `${property.locality}, ${property.city}`,
    type: formatPropertyType(property.category),
    price: formatPrice(property),
    meta: formatPropertyMeta(property),
    image: cover?.deliveryUrl ?? fallbackImages[index % fallbackImages.length],
    featured: index === 0,
  };
}

const categories = [
  { label: 'Hotels & stays', count: '18 properties', icon: Hotel, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=700&q=85' },
  { label: 'Land & acreage', count: '31 properties', icon: LandPlot, image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=85' },
  { label: 'Homes & villas', count: '24 properties', icon: Trees, image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=700&q=85' },
  { label: 'Commercial', count: '11 properties', icon: Building2, image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=700&q=85' },
];

export function PropertyExplorer() {
  const [intent, setIntent] = useState<Intent>('buy');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Any property');
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [properties, setProperties] = useState<DisplayProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  async function loadProperties(search = '') {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetchProperties(search);
      setProperties(response.items.map(toDisplayProperty));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Properties could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProperties(); }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set('q', location.trim());
    if (intent === 'buy') params.set('purpose', 'SALE');
    if (intent === 'lease') params.set('purpose', 'LEASE');
    if (intent === 'stay') params.set('purpose', 'RENT');
    const categoryValue = category === 'Hotels & stays' ? 'HOTEL' : category === 'Land & acreage' ? 'LAND' : category === 'Homes & villas' ? 'HOUSE_VILLA' : category === 'Commercial' ? 'COMMERCIAL' : '';
    if (categoryValue) params.set('category', categoryValue);
    setStatus(`Showing ${intent === 'stay' ? 'stays' : intent === 'lease' ? 'lease opportunities' : 'properties'}${location ? ` near ${location}` : ''}.`);
    void loadProperties(params.toString());
    document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function toggleSaved(title: string) {
    setSaved((current) => (current.includes(title) ? current.filter((item) => item !== title) : [...current, title]));
  }

  return (
    <main className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Himalayan Estates home">
          <span className="brand-mark" aria-hidden="true"><Compass size={18} strokeWidth={1.7} /></span>
          <span><strong>Himalayan</strong><em>Estates</em></span>
        </a>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a href="#properties">Explore</a>
          <a href="#categories">Collection</a>
          <a href="#approach">Our approach</a>
          <a href="#contact">Talk to a broker</a>
        </nav>
        <div className="header-actions">
          <button className="text-button hide-mobile" type="button" onClick={() => setStatus('Your saved shortlist will appear here after sign in.')}>Saved <span>{saved.length || ''}</span></button>
          <button className="outline-button hide-mobile" type="button" onClick={() => setStatus('Tell us what you are looking for and a broker will reach out.')}>List a property</button>
          <button className="menu-button" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy reveal-up">
          <p className="eyebrow"><span /> THE QUIET SIDE OF PROPERTY</p>
          <h1 id="hero-title">Find a place<br /><i>worth staying for.</i></h1>
          <p className="hero-intro">A considered collection of mountain homes, hospitality assets and land with room to grow.</p>
          <div className="hero-proof"><ShieldCheck size={16} /><span>Curated by local brokers</span><span className="proof-dot" /><span>Verified opportunities</span></div>
        </div>
        <div className="hero-art" aria-label="Aerial view of a Himalayan valley">
          <div className="hero-image" />
          <div className="image-caption"><span>01</span><span>Where the road gets quieter</span></div>
          <div className="hero-stamp"><span>H.E.</span><small>EST. 2016</small></div>
        </div>
        <div className="search-panel-wrap reveal-up delay-1">
          <form className="search-panel" onSubmit={submitSearch}>
            <div className="intent-tabs" role="tablist" aria-label="What are you looking for?">
              {(['buy', 'lease', 'stay'] as Intent[]).map((option) => (
                <button className={intent === option ? 'active' : ''} key={option} type="button" role="tab" aria-selected={intent === option} onClick={() => setIntent(option)}>
                  {option === 'buy' ? 'Buy' : option === 'lease' ? 'Lease' : 'Stay'}
                </button>
              ))}
            </div>
            <label className="search-field location-field"><MapPin size={18} aria-hidden="true" /><span><small>Location</small><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Try Old Manali, Solang…" aria-label="Search location in Manali" /></span></label>
            <label className="search-field"><Sparkles size={18} aria-hidden="true" /><span><small>Property type</small><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Property type"><option>Any property</option><option>Hotels & stays</option><option>Land & acreage</option><option>Homes & villas</option><option>Commercial</option></select></span><ChevronDown size={16} aria-hidden="true" /></label>
            <button className="search-button" type="submit"><Search size={18} aria-hidden="true" /><span>Find a place</span></button>
          </form>
          <div className="search-note" aria-live="polite">{status || 'Search the collection by place, property type or feeling.'}<span>⌘ K</span></div>
        </div>
      </section>

      <div className="content-shell" id="main-content">
        <section className="section categories-section" id="categories" aria-labelledby="categories-title">
          <div className="section-heading"><div><p className="eyebrow">START WITH A FEELING</p><h2 id="categories-title">Spaces with a story.</h2></div><a className="arrow-link" href="#properties">View all properties <ArrowUpRight size={17} /></a></div>
          <div className="category-grid">
            {categories.map(({ label, count, icon: Icon, image }) => <a className="category-card" href="#properties" key={label}><img src={image} alt="" width="700" height="480" /><div className="category-overlay" /><div className="category-copy"><Icon size={20} strokeWidth={1.5} /><div><h3>{label}</h3><p>{count}</p></div><ArrowUpRight className="card-arrow" size={19} /></div></a>)}
          </div>
        </section>

        <section className="section listings-section" id="properties" aria-labelledby="listings-title">
          <div className="section-heading"><div><p className="eyebrow">THE LATEST EDIT</p><h2 id="listings-title">Recently on our map.</h2></div><div className="listing-nav"><button type="button" aria-label="Previous properties"><ArrowUpRight size={17} className="rotate-left" /></button><button type="button" aria-label="Next properties"><ArrowUpRight size={17} /></button></div></div>
          {loading ? <div className="empty-state"><Compass size={28} /><h3>Finding the quiet places…</h3><p>Loading the latest Manali collection.</p></div> : loadError ? <div className="empty-state"><Compass size={28} /><h3>The collection is taking a moment.</h3><p>{loadError}</p><button type="button" onClick={() => void loadProperties()}>Try again</button></div> : properties.length ? <div className="listing-grid">{properties.map((property) => <article className={`property-card ${property.featured ? 'featured-card' : ''}`} key={property.title}><div className="property-image-wrap"><a href={`/properties/${property.slug}`} aria-label={`View ${property.title}`}><img src={property.image} alt={`${property.title}, ${property.type}`} width="1100" height="740" /></a><span className="property-type">{property.type}</span><button className={`save-button ${saved.includes(property.title) ? 'is-saved' : ''}`} type="button" aria-label={`${saved.includes(property.title) ? 'Remove' : 'Save'} ${property.title}`} aria-pressed={saved.includes(property.title)} onClick={() => toggleSaved(property.title)}><Heart size={18} fill={saved.includes(property.title) ? 'currentColor' : 'none'} /></button></div><div className="property-info"><div><h3><a href={`/properties/${property.slug}`}>{property.title}</a></h3><p><MapPin size={13} />{property.location}</p></div><a href={`/properties/${property.slug}`} className="property-arrow" aria-label={`View ${property.title}`}><ArrowUpRight size={18} /></a><div className="property-meta"><strong>{property.price}</strong><span>{property.meta}</span></div></div></article>)}</div> : <div className="empty-state"><Compass size={28} /><h3>Nothing on this trail yet.</h3><p>Try a nearby town or clear the location to see the full collection.</p><button type="button" onClick={() => { setLocation(''); void loadProperties(); }}>Show all properties</button></div>}
        </section>

        <section className="approach-section" id="approach" aria-labelledby="approach-title">
          <div className="approach-image"><img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85" alt="Misty mountain ridges at dawn" width="1200" height="1000" /><span className="vertical-label">A SLOWER KIND OF SEARCH</span></div>
          <div className="approach-copy"><p className="eyebrow">WHY HIMALAYAN ESTATES</p><h2 id="approach-title">Good property is more than a pin on a map.</h2><p>We know the bends in the road, the spring that runs year-round, the view that looks different after the monsoon. Our small team pairs local knowledge with a careful eye for opportunity.</p><a className="dark-button" href="#contact">Meet the people behind the map <ArrowUpRight size={17} /></a><div className="approach-signature"><span>“</span><p>For places that are<br />hard to find, and easy<br />to remember.</p></div></div>
        </section>

        <section className="contact-strip" id="contact" aria-labelledby="contact-title"><div><p className="eyebrow">A CONVERSATION IS A GOOD START</p><h2 id="contact-title">Looking for something specific?</h2></div><button className="light-button" type="button" onClick={() => setStatus('Thank you. A Himalayan Estates broker will be in touch shortly.')}>Tell us what you need <ArrowUpRight size={17} /></button></section>
      </div>

      <footer className="footer"><div className="brand footer-brand"><span className="brand-mark" aria-hidden="true"><Compass size={18} strokeWidth={1.7} /></span><span><strong>Himalayan</strong><em>Estates</em></span></div><p>Properties with a point of view.</p><div className="footer-links"><a href="#top">Instagram</a><a href="#contact">Contact</a><a href="#top">Privacy</a></div></footer>
    </main>
  );
}
