"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Check, Compass, MapPin, ShieldCheck } from 'lucide-react';
import { ApiProperty, fetchProperty, formatPrice, formatPropertyType } from '@/lib/api';
import { useSiteImages, useSitePage, useSiteSetting } from '@/lib/site-data';
import { sitePageDefaults } from '@/lib/site-page-defaults';
import { scenicImageStyle } from '@/lib/site-images';
import { Header, Footer } from './SiteChrome';
import InquiryForm from './InquiryForm';
import ManaliLocation from './ManaliLocation';
import PropertyGallery from './PropertyGallery';
import './property-detail.css';

export interface PropertyDetailProps { slug: string }

export default function PropertyDetail({ slug }: PropertyDetailProps) {
  const image = useSiteImages();
  const content = useSitePage<typeof sitePageDefaults['property-detail']>('property-detail');
  const broker = useSiteSetting('contact.name');
  const phone = useSiteSetting('contact.phone');
  const email = useSiteSetting('contact.email');
  const [property, setProperty] = useState<ApiProperty | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setProperty(null); setError('');
    fetchProperty(slug).then(result => { if (active) setProperty(result.property); }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load this property.'); });
    return () => { active = false; };
  }, [slug]);
  const phoneDigits = phone.replace(/\D/g, '');
  const whatsapp = phoneDigits.length >= 7 ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hello, I would like the property brief for ${property?.title ?? 'a Manali property'}.`)}` : '';
  const category = property ? formatPropertyType(property.category) : '';
  const purpose = property ? formatPropertyType(property.purpose) : '';
  const area = property?.areaValue && property.areaUnit ? `${Number(property.areaValue).toLocaleString('en-IN')} ${property.areaUnit}` : 'On request';
  const verification = property ? formatPropertyType(property.verificationStatus) : '';
  const specs = property ? [['Property type', category], ['Available for', purpose], ['Listed area', area], ['Locality', property.locality], ['City', property.city], ['Pricing', formatPropertyType(property.priceMode)], ['Listing verification', verification], ['Reference', property.slug]] : [];

  return <><Header/><main id="main-content" className="estate-detail">
    {error ? <div className="empty-state" role="alert"><h1>{error}</h1><Link className="button" href="/properties">Back to collection</Link></div> : !property ? <div className="empty-state" role="status"><h1>Opening the estate dossier…</h1></div> : <>
      <section className="estate-hero" style={scenicImageStyle(image('propertyHero').src)}>
        <div className="estate-container">
          <div className="estate-hero-top"><nav className="estate-breadcrumb" aria-label="Breadcrumb"><Link href="/properties"><ArrowLeft size={13}/>The collection</Link><span>/</span><span>{property.locality}</span></nav><div className="estate-badges"><span>{category}</span><span>{purpose}</span>{property.verificationStatus === 'VERIFIED' && <span><ShieldCheck size={13}/>Verified listing</span>}</div></div>
          <div className="estate-title-row"><div><p className="estate-location"><MapPin size={15}/>{property.locality}, {property.city}</p><h1>{property.title}</h1><p className="estate-hero-intro">{property.description.slice(0, 190)}{property.description.length > 190 ? '…' : ''}</p></div><aside className="estate-offer"><p>{content.hero.priceLabel}</p><strong>{formatPrice(property)}</strong><span>{content.hero.priceNote}</span></aside></div>
          <div className="estate-actions"><a className="button gold" href="#contact">{content.hero.briefButton}<ArrowUpRight size={16}/></a><a className="button estate-outline-button" href="#contact">{content.hero.visitButton}<ArrowUpRight size={16}/></a>{whatsapp && <a className="estate-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer">{content.hero.whatsappButton}<ArrowUpRight size={16}/><span className="sr-only"> (opens in a new tab)</span></a>}</div>
        </div>
      </section>
      <section className="estate-facts" aria-label="Key property information"><div className="estate-container">{[['Property category', category], ['Listed area', area], ['Available for', purpose], ['Setting', property.locality], ['Listing verification', verification]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>
      <section className="estate-gallery-section estate-container" aria-labelledby="estate-gallery-title"><div className="estate-section-heading"><div><p className="eyebrow">{content.gallery.eyebrow}</p><h2 id="estate-gallery-title">{content.gallery.title}</h2></div><p>{content.gallery.intro}</p></div><PropertyGallery key={slug} media={property.media ?? []} title={property.title} emptyTitle={content.gallery.emptyTitle} emptyBody={content.gallery.emptyBody}/></section>
      <section className="estate-overview"><div className="estate-container estate-overview-grid"><article><p className="eyebrow">{content.overview.eyebrow}</p><h2>{content.overview.title}</h2><div className="estate-description">{property.description.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>{property.amenities.length > 0 && <div className="estate-amenities"><h3>{content.overview.amenitiesTitle}</h3><ul>{property.amenities.map(amenity => <li key={amenity}><Check size={15}/>{amenity}</li>)}</ul></div>}</article><aside className="estate-specs"><div className="estate-specs-heading"><h3>{content.overview.specsTitle}</h3><Compass size={23}/></div><dl>{specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p>{content.overview.specsNote}</p></aside></div></section>
      <section className="estate-diligence"><div className="estate-container"><div className="estate-section-heading"><div><p className="eyebrow">{content.diligence.eyebrow}</p><h2>{content.diligence.title}</h2></div><p>{content.diligence.intro}</p></div><div className="estate-diligence-grid">{content.diligence.items.map((item, index) => <article key={index}><span>{String(index + 1).padStart(2, '0')}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div><div className="estate-diligence-note"><p>{content.diligence.note}</p><Link href="/privacy">{content.diligence.link}<ArrowUpRight size={14}/></Link></div></div></section>
      <div className="estate-location-section"><ManaliLocation/></div>
      <div className="estate-inquiry-band"><InquiryForm propertyId={property.id} title={property.title} intro={<div className="estate-advisor"><p className="eyebrow">{content.advisor.eyebrow}</p><span className="estate-advisor-mark"><Compass size={30}/></span><h2>{content.advisor.title}</h2><p className="estate-advisor-name">{broker}</p><p>{content.advisor.body}</p><div className="estate-advisor-contacts"><span><MapPin size={16}/>Manali, Himachal Pradesh</span>{phoneDigits.length >= 7 && <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>}{email && <a href={`mailto:${email}`}>{email}</a>}</div>{whatsapp && <a className="text-link" href={whatsapp} target="_blank" rel="noopener noreferrer">{content.advisor.whatsapp}<ArrowUpRight size={15}/><span className="sr-only"> (opens in a new tab)</span></a>}</div>}/></div>
    </>}
  </main><Footer/></>;
}
