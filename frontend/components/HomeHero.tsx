"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Search, ShieldCheck } from 'lucide-react';
import { useSiteImages, useSitePage } from '@/lib/site-data';
import { validImageUrl } from '@/lib/site-images';
import './home-hero.css';

type Slide = { title: string; intro: string; image: string; alt: string; active?: boolean };
type Hero = { title: string; intro: string; image: string; slides?: Slide[] };

export default function HomeHero({ categories, onSearch }: { categories: { value: string; label: string }[]; onSearch: (event: FormEvent<HTMLFormElement>) => void }) {
  const { hero } = useSitePage<{ hero: Hero }>('home');
  const image = useSiteImages();
  const slides = useMemo(() => {
    const primary = image('homeHero', hero.image);
    const first = { title: hero.title, intro: hero.intro, image: primary.src, alt: primary.alt };
    const extra = Array.isArray(hero.slides) ? hero.slides.flatMap((item, index) => {
      if (!item || typeof item.title !== 'string' || typeof item.intro !== 'string' || item.active === false) return [];
      const photo = image(`homeHeroSlide${index + 2}`, typeof item.image === 'string' ? item.image : undefined);
      return [{ title: item.title, intro: item.intro, image: photo.src, alt: typeof item.alt === 'string' ? item.alt : photo.alt }];
    }) : [];
    return [first, ...extra].map(slide => ({ ...slide, image: slide.image && validImageUrl(slide.image) ? slide.image : '' }));
  }, [hero, image]);
  const [active, setActive] = useState(0);
  const [changed, setChanged] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [held, setHeld] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const section = useRef<HTMLElement>(null);
  const current = Math.min(active, slides.length - 1);
  const running = enabled && !paused && !focused && !held && visible && !hidden;

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setEnabled(!preference.matches);
    const visibility = () => setHidden(document.hidden);
    const release = () => setHeld(false);
    motion(); visibility();
    preference.addEventListener('change', motion);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('pointerup', release);
    document.addEventListener('pointercancel', release);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    if (section.current) observer.observe(section.current);
    return () => { observer.disconnect(); preference.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility); document.removeEventListener('pointerup', release); document.removeEventListener('pointercancel', release); };
  }, []);

  useEffect(() => {
    section.current?.querySelectorAll<HTMLImageElement>('.hero-slide-photo').forEach(photo => {
      if (photo.complete && photo.naturalWidth) setLoaded(previous => previous[photo.getAttribute('src') || ''] ? previous : { ...previous, [photo.getAttribute('src') || '']: true });
    });
  }, [slides]);

  useEffect(() => {
    if (!running || slides.length < 2) return;
    let next = (current + 1) % slides.length;
    while (next !== current && slides[next].image && failed[slides[next].image]) next = (next + 1) % slides.length;
    if (next === current) return;
    if (slides[next].image && !loaded[slides[next].image]) return;
    const timer = window.setTimeout(() => { setChanged(true); setActive(next); }, 7000);
    return () => window.clearTimeout(timer);
  }, [current, running, slides, loaded, failed]);

  const slide = slides[current];
  return <section ref={section} className="hero home-hero" aria-roledescription="carousel" aria-label="Discover Himalayan Estates" data-running={running}
    onPointerDown={() => setHeld(true)} onPointerLeave={() => setHeld(false)}
    onFocusCapture={event => setFocused(!(event.target as HTMLElement).closest('[data-hero-toggle]') && (event.target as HTMLElement).matches(':focus-visible'))}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
    {slides.map((item, index) => item.image && <img key={`${index}-${item.image}`} className={`hero-photo hero-slide-photo${index === current ? ' is-active' : ''}`} src={item.image} alt={index === current ? item.alt : ''} aria-hidden={index !== current} hidden={failed[item.image]} width={1800} height={1000} loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'low'} decoding="async" onLoad={() => setLoaded(previous => ({ ...previous, [item.image]: true }))} onError={() => setFailed(previous => ({ ...previous, [item.image]: true }))}/>)}
    <div className="hero-shade"/>
    <div className="hero-content"><div key={current} className={`home-hero-copy${changed ? ' is-changing' : ''}`}><h1>{slide.title}</h1><p>{slide.intro}</p><a href="#collection" className="hero-link">Discover your mountain address <ArrowUpRight size={18}/></a></div></div>
    <form className="search-panel" onSubmit={onSearch}><label>PROPERTY TYPE<select name="category"><option value="">All properties</option>{categories.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label><label>PREFERRED LOCATION<input name="q" placeholder="Old Manali, Solang, Naggar…"/></label><label>YOUR INTENTION<select name="purpose"><option value="">Buy, rent or lease</option><option value="SALE">Buy</option><option value="RENT">Rent</option><option value="LEASE">Lease</option></select></label><button className="button"><Search size={17}/>Explore properties</button></form>
    <div className="home-hero-controls"><div role="group" aria-label="Choose a hero slide">{slides.map((item, index) => <button key={index} type="button" aria-label={`Show hero slide ${index + 1}: ${item.title}`} aria-pressed={index === current} onClick={() => { setChanged(true); setActive(index); }}><span/></button>)}</div>{slides.length > 1 && <button className="hero-rotation-control" data-hero-toggle type="button" onClick={() => { setFocused(false); setPaused(value => !value); }} aria-label={paused ? 'Resume hero slideshow' : 'Stop hero slideshow'}>{paused ? 'Resume hero slideshow' : 'Stop hero slideshow'}</button>}</div>
    <div className="hero-foot"><span><ShieldCheck size={15}/>Broker-assisted due diligence</span><span>Local insight. Personal introductions.</span><span>Manali, Himachal Pradesh</span></div>
    <span className="sr-only" aria-live={running ? 'off' : 'polite'}>{current + 1} of {slides.length}: {slide.title}</span>
  </section>;
}
