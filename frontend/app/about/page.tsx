'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/SiteChrome';
import { aboutContent } from '@/lib/about-content';
import { scenicImageStyle } from '@/lib/site-images';
import { useSiteImages, useSitePage } from '@/lib/site-data';

function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLElement>(null);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    setDisplay(value);
    const match = /^(\d+)(.*)$/.exec(value);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!match || !ref.current || preference.matches || !('IntersectionObserver' in window)) return;
    const target = Number(match[1]);
    if (!Number.isSafeInteger(target)) return;
    let frame = 0;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      setDisplay(`0${match[2]}`);
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 600, 1);
        setDisplay(`${Math.round(target * (1 - (1 - progress) ** 3))}${match[2]}`);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    const stop = () => { cancelAnimationFrame(frame); observer.disconnect(); setDisplay(value); };
    preference.addEventListener('change', stop);
    observer.observe(ref.current);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); preference.removeEventListener('change', stop); };
  }, [value]);
  return <strong ref={ref} aria-label={value} style={{ fontVariantNumeric: 'tabular-nums' }}><span aria-hidden="true">{display}</span></strong>;
}

export default function AboutPage() {
  const content = useSitePage<typeof aboutContent>('about');
  const image = useSiteImages();
  return <><Header/><main id="main-content">
    <section className="advisory-hero" style={scenicImageStyle(image("aboutHero").src)}><p className="eyebrow">ABOUT HIMALAYAN ESTATES</p><h1>{content.hero.title}</h1><p>{content.hero.intro}</p></section>
    <section className="approach-section"><img src={image("aboutStory").src || undefined} hidden={!image("aboutStory").src} alt={image("aboutStory").alt} width={1000} height={800}/><div><p className="eyebrow">ROOTED IN MANALI</p><h2>{content.story.title}</h2><p>{content.story.body}</p><Link className="text-link" href="/contact">Get to know us</Link></div></section>
    <section className="section"><div className="section-heading"><div><h2>{content.work.title}</h2><p>{content.work.intro}</p></div></div><div className="about-milestones">{content.stats.map((stat,index)=><div key={index}><CountUp value={`${stat.value}${stat.suffix}`}/><p>{stat.label}</p></div>)}</div></section>
    {content.missionVision.enabled && <section className="section about-extra-grid"><div><h2>{content.missionVision.missionTitle}</h2><p>{content.missionVision.mission}</p></div><div><h2>{content.missionVision.visionTitle}</h2><p>{content.missionVision.vision}</p></div></section>}
    {content.values.enabled && <section className="section"><h2>{content.values.title}</h2><div className="about-extra-grid">{content.values.items.map((item,index)=><article key={index}><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section>}
    <section className="section"><h2>{content.approach.title}</h2><p className="service-intro">{content.approach.body}</p><Link className="text-link" href="/contact">Begin a conversation</Link></section>
  </main><Footer/></>;
}
