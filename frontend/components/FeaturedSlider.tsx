"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, MapPin, ShieldCheck } from 'lucide-react';
import { ApiProperty, formatPrice, formatPropertyType } from '@/lib/api';

export default function FeaturedSlider({ properties }: { properties: ApiProperty[] }) {
  const slides = useMemo(() => properties.slice(0, 5), [properties]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(true);
  const [interacting, setInteracting] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const slider = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>();
  const activeIndex = useRef(0);
  const drag = useRef<{ x: number; y: number; left: number; index: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  activeIndex.current = active;

  const select = useCallback((index: number) => {
    if (!slides.length) return;
    const next = (index + slides.length) % slides.length;
    setActive(next);
    const element = viewport.current;
    element?.scrollTo({ left: next * element.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [slides.length]);

  function finishDrag(cancelled = false) {
    const gesture = drag.current;
    const element = viewport.current;
    drag.current = null;
    if (!gesture || !element) return;
    const distance = element.scrollLeft - gesture.left;
    element.style.scrollSnapType = '';
    delete element.dataset.dragging;
    if (gesture.moved) {
      const offset = !cancelled && Math.abs(distance) > Math.min(80, element.clientWidth * 0.15) ? Math.sign(distance) : 0;
      select(Math.max(0, Math.min(slides.length - 1, gesture.index + offset)));
      window.setTimeout(() => { suppressClick.current = false; }, 0);
    }
  }

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPaused(preference.matches);
    const motionChanged = () => { if (preference.matches) setPaused(true); };
    const visibilityChanged = () => setHidden(document.hidden);
    visibilityChanged();
    preference.addEventListener('change', motionChanged);
    document.addEventListener('visibilitychange', visibilityChanged);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    if (slider.current) observer.observe(slider.current);
    let width = viewport.current?.clientWidth;
    const resize = new ResizeObserver(() => {
      const element = viewport.current;
      if (element && element.clientWidth !== width) {
        width = element.clientWidth;
        element.scrollTo({ left: activeIndex.current * element.clientWidth, behavior: 'instant' });
      }
    });
    if (viewport.current) resize.observe(viewport.current);
    return () => {
      observer.disconnect(); resize.disconnect(); clearTimeout(scrollTimer.current);
      preference.removeEventListener('change', motionChanged);
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
  }, []);

  useEffect(() => {
    if (paused || interacting || keyboardFocus || !visible || hidden || slides.length < 2) return;
    const timer = window.setTimeout(() => select(active + 1), 5000);
    return () => window.clearTimeout(timer);
  }, [active, paused, interacting, keyboardFocus, visible, hidden, slides.length, select]);

  useEffect(() => {
    if (active >= slides.length) select(0);
  }, [active, slides.length, select]);

  if (!slides.length) return null;
  const current = Math.min(active, slides.length - 1);

  return <section ref={slider} className="featured-slider section" aria-labelledby="featured-title" aria-roledescription="carousel"
    onFocusCapture={event => { if (!(event.target as HTMLElement).closest('[data-slideshow-toggle]')) setKeyboardFocus((event.target as HTMLElement).matches(':focus-visible')); }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setKeyboardFocus(false); }}>
    <div className="slider-heading">
      <div><p className="eyebrow">THE PRIVATE COLLECTION</p><h2 id="featured-title">Featured estates.</h2></div>
      <div className="slider-controls" aria-label="Featured property controls">
        <span className="slider-count">{String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
      </div>
    </div>
    <div ref={viewport} className="featured-stage" tabIndex={0} role="group" aria-label="Featured properties. Swipe or use the arrow keys to browse."
      onPointerDown={event => {
        setInteracting(true);
        if (event.pointerType === 'mouse' && event.button === 0) drag.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, index: active, moved: false };
      }}
      onPointerMove={event => {
        const gesture = drag.current;
        if (!gesture) return;
        const distance = event.clientX - gesture.x;
        if (!gesture.moved && (Math.abs(distance) < 8 || Math.abs(distance) < Math.abs(event.clientY - gesture.y))) return;
        gesture.moved = true;
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.style.scrollSnapType = 'none';
        event.currentTarget.dataset.dragging = 'true';
        event.currentTarget.scrollLeft = gesture.left - distance;
        event.preventDefault();
      }}
      onPointerUp={() => { setInteracting(false); finishDrag(); }}
      onPointerLeave={event => { if (event.pointerType === 'mouse' && !drag.current?.moved) { setInteracting(false); finishDrag(true); } }}
      onPointerCancel={() => { setInteracting(false); finishDrag(true); }}
      onLostPointerCapture={() => { setInteracting(false); finishDrag(true); }}
      onDragStart={event => event.preventDefault()}
      onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}
      onScroll={() => {
        clearTimeout(scrollTimer.current);
        if (drag.current?.moved) return;
        scrollTimer.current = setTimeout(() => {
          const element = viewport.current;
          if (element?.clientWidth) setActive(Math.max(0, Math.min(slides.length - 1, Math.round(element.scrollLeft / element.clientWidth))));
        }, 120);
      }}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); select(active + (event.key === 'ArrowLeft' ? -1 : 1)); }
      }}>
      {slides.map((property, index) => {
        const cover = property.media?.find(media => media.isCover) ?? property.media?.[0];
        return <article key={property.id} className="featured-slide" role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`} aria-hidden={index !== current}
          ref={element => { if (element) element.inert = index !== current; }}>
          <Link className="featured-media" href={`/properties/${property.slug}`} aria-label={`Open ${property.title}`}>
            {cover ? <img src={cover.deliveryUrl} alt={cover.altText} width={1200} height={800} loading="lazy"/> : <div className="image-placeholder"><MapPin size={22}/><span>Photography available on enquiry</span></div>}
            <span className="featured-media-action"><ArrowUpRight size={19}/></span>
          </Link>
          <div className="featured-copy">
            <p className="featured-kicker">{formatPropertyType(property.category)} · {property.purpose.replaceAll('_', ' ')}</p>
            <h3>{property.title}</h3>
            <p className="featured-location"><MapPin size={14}/>{property.locality}, {property.city}</p>
            <p className="featured-description">{property.description.slice(0, 180)}{property.description.length > 180 ? '…' : ''}</p>
            <div className="featured-footer"><strong>{formatPrice(property)}</strong>{property.verificationStatus === 'VERIFIED' && <span><ShieldCheck size={14}/>Verified opportunity</span>}</div>
            <Link className="text-link" href={`/properties/${property.slug}`}>Open property dossier <ArrowUpRight size={17}/></Link>
          </div>
        </article>;
      })}
    </div>
    <div className="slider-bottom-controls">
      <div className="slider-progress" role="group" aria-label="Choose a featured property">
        {slides.map((item, index) => <button key={item.id} type="button" aria-pressed={current === index} aria-label={`Show ${item.title}`} onClick={() => select(index)}><span/></button>)}
      </div>
      {slides.length > 1 && <button type="button" data-slideshow-toggle className="slider-autoplay" onClick={() => { setKeyboardFocus(false); setPaused(value => !value); }}>{paused ? 'Resume sliding' : 'Stop sliding'}</button>}
    </div>
    <span className="sr-only" aria-live={paused || interacting || keyboardFocus ? 'polite' : 'off'} aria-atomic="true">Property {current + 1} of {slides.length}: {slides[current].title}</span>
  </section>;
}
