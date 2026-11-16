"use client";

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Compass, ShieldCheck } from 'lucide-react';
import { advisorySources } from '@/lib/advisory-content';
import { sitePageDefaults } from '@/lib/site-page-defaults';
import { scenicImageStyle } from '@/lib/site-images';
import { useSiteImages, useSitePage, useSiteSetting } from '@/lib/site-data';
import { Header, Footer } from './SiteChrome';
import InquiryForm from './InquiryForm';
import './advisory-guide.css';

export default function AdvisoryGuide() {
  const content = useSitePage<typeof sitePageDefaults.advisory>('advisory');
  const image = useSiteImages();
  const { profiles, assets, locations } = content.assessment;
  const broker = useSiteSetting('contact.name');
  const phone = useSiteSetting('contact.phone');
  const [pathway, setPathway] = useState(0);
  const [profile, setProfile] = useState(0);
  const [asset, setAsset] = useState(0);
  const [location, setLocation] = useState(0);
  const [brief, setBrief] = useState('');
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const current = Math.min(pathway, Math.max(0, content.pathways.length - 1));
  const panel = content.pathways[current];
  const summary = `${content.assessment.profileLabel}: ${profiles[profile] ?? "Not specified"}\n${content.assessment.assetLabel}: ${assets[asset] ?? "Not specified"}\n${content.assessment.locationLabel}: ${locations[location] ?? "Not specified"}`;
  const questions = [
    profile >= 2 ? content.assessment.overseasQuestion : content.assessment.profileQuestion,
    asset === 2 ? content.assessment.landQuestion : content.assessment.buildingQuestion,
    location === 0 ? content.assessment.townQuestion : content.assessment.areaQuestion,
  ];

  return <><Header/><main id="main-content" className="legal-guide">
    <section className="legal-hero" style={scenicImageStyle(image('advisoryHero').src)}><div className="legal-container">
      <nav className="legal-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/privacy">Policies</Link><span>/</span><span>Section 118 advisory</span></nav>
      <p className="eyebrow"><ShieldCheck size={15}/>{content.hero.eyebrow}</p><h1>{content.hero.title}<em>{content.hero.subtitle}</em></h1><p className="legal-hero-intro">{content.hero.intro}</p>
      <a href="#consultation-form" className="button gold">{content.hero.cta}<ArrowUpRight size={16}/></a>
      <div className="legal-principles">{content.principles.map((item, index) => <div key={index}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><p>{item.body}</p></div></div>)}</div>
    </div></section>
    <section className="legal-section"><div className="legal-container legal-framework"><article><p className="eyebrow">{content.framework.eyebrow}</p><h2>{content.framework.title}</h2><p>{content.framework.body}</p><aside className="legal-note"><strong>{content.framework.noteTitle}</strong><p>{content.framework.note}</p></aside></article>
      <div className="legal-pathways"><div className="legal-tabs" role="tablist" aria-label="Property review topics">{content.pathways.map((item, index) => <button key={index} type="button" role="tab" ref={element => { tabs.current[index] = element; }} id={`pathway-tab-${index}`} aria-selected={current === index} aria-controls="pathway-panel" tabIndex={current === index ? 0 : -1} onClick={() => setPathway(index)} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? content.pathways.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + content.pathways.length) % content.pathways.length;
        setPathway(next); tabs.current[next]?.focus();
      }}>{item.tab}</button>)}</div>
      {panel && <article id="pathway-panel" className="legal-pathway-panel" role="tabpanel" aria-labelledby={`pathway-tab-${current}`} tabIndex={0}><p className="legal-tag">{panel.tag}</p><h3>{panel.title}</h3><p>{panel.body}</p><div className="legal-checks">{panel.checks.map((item, index) => <div key={index}><Check size={16}/><div><strong>{item.title}</strong><p>{item.body}</p></div></div>)}</div><p className="legal-pathway-footer">{panel.footer}</p></article>}</div>
    </div></section>
    <section className="legal-section legal-muted"><div className="legal-container"><div className="legal-section-heading"><div><p className="eyebrow">{content.process.eyebrow}</p><h2>{content.process.title}</h2></div><p>{content.process.note}</p></div><ol className="legal-process">{content.process.items.map((item, index) => <li key={index}><span className="legal-step-number">{String(index + 1).padStart(2, '0')}</span><h3>{item.title}</h3><p>{item.body}</p><strong>{item.output}</strong></li>)}</ol></div></section>
    <section className="legal-section"><div className="legal-container"><div className="legal-section-heading"><div><p className="eyebrow">{content.glossary.eyebrow}</p><h2>{content.glossary.title}</h2></div><p>{content.glossary.intro}</p></div><div className="legal-glossary">{content.glossary.items.map((item, index) => <article key={index}><h3>{item.title}</h3><span>{item.label}</span><p>{item.body}</p></article>)}</div></div></section>
    <section className="legal-section legal-dark"><div className="legal-container"><div className="legal-section-heading"><div><p className="eyebrow">{content.risks.eyebrow}</p><h2>{content.risks.title}</h2></div><p>{content.risks.intro}</p></div><div className="legal-risks">{content.risks.items.map((item, index) => <article key={index}><span>{String(index + 1).padStart(2, '0')}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></div></section>
    <section className="legal-section"><div className="legal-container"><div className="legal-assessment"><div className="legal-centered-heading"><p className="eyebrow">{content.assessment.eyebrow}</p><h2>{content.assessment.title}</h2><p>{content.assessment.intro}</p></div><div className="legal-assessment-fields"><label>{content.assessment.profileLabel}<select value={profile} onChange={event => setProfile(Number(event.target.value))}>{profiles.map((item, index) => <option key={item} value={index}>{item}</option>)}</select></label><label>{content.assessment.assetLabel}<select value={asset} onChange={event => setAsset(Number(event.target.value))}>{assets.map((item, index) => <option key={item} value={index}>{item}</option>)}</select></label><label>{content.assessment.locationLabel}<select value={location} onChange={event => setLocation(Number(event.target.value))}>{locations.map((item, index) => <option key={item} value={index}>{item}</option>)}</select></label></div>
      <div className="legal-review-result" aria-live="polite" aria-atomic="true"><span className="legal-review-icon"><Compass size={26}/></span><div><p className="eyebrow">{content.assessment.resultLabel}</p><h3>{content.assessment.resultTitle}</h3><p className="legal-selection-summary">{summary}</p><ul>{questions.map(question => <li key={question}>{question}</li>)}</ul></div></div><p className="legal-assessment-note">{content.assessment.note}</p><button className="button" onClick={() => {
        setBrief(summary.slice(0, 600));
        document.getElementById('consultation-form')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      }}>{content.assessment.cta}<ArrowUpRight size={16}/></button></div></div></section>
    <section className="legal-section legal-muted legal-support"><div className="legal-container"><div className="legal-note"><Compass size={30}/><h2>{content.framework.noteTitle}</h2><p>{content.framework.note}</p><Link href="/privacy" className="text-link">Privacy & property policies<ArrowUpRight size={15}/></Link></div><div><p className="eyebrow">{content.consultation.eyebrow}</p><h2>{content.consultation.title}</h2><p>{content.consultation.body}</p><div className="legal-broker-contact"><strong>{broker}</strong><span>{content.consultation.phoneLabel}</span>{phone && <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>}</div></div></div></section>
    <section className="legal-consultation" id="consultation-form"><InquiryForm source="section118-advisory" formTitle={content.consultation.formTitle} context={brief || undefined} intro={<><p className="eyebrow">{content.consultation.eyebrow}</p><h2>{content.consultation.title}</h2><p>{content.consultation.body}</p>{brief && <div className="legal-consultation-brief"><strong>{content.consultation.briefTitle}</strong><p>{brief}</p></div>}</>}/></section>
    <section className="legal-sources legal-container"><h2>{content.sources.title}</h2><p>{content.sources.note}</p><div>{advisorySources.map(source => <a key={source.href} href={source.href} target="_blank" rel="noopener noreferrer">{source.label}<ArrowUpRight size={14}/><span className="sr-only"> (opens in a new tab)</span></a>)}</div></section>
  </main><Footer/></>;
}
