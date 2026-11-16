"use client";

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { manaliLandmarks } from '@/lib/manali-landmarks';
import 'leaflet/dist/leaflet.css';
import './manali-location.css';

export default function ManaliLocation() {
  const section = useRef<HTMLElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<Record<string, Marker>>({});
  const [nearby, setNearby] = useState(false);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!('IntersectionObserver' in window)) { setNearby(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNearby(true); observer.disconnect(); }
    }, { rootMargin: '300px' });
    if (section.current) observer.observe(section.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!nearby) return;
    let cancelled = false;
    let instance: LeafletMap | undefined;
    let resize: ResizeObserver | undefined;
    void import('leaflet').then(L => {
      if (cancelled || !container.current) return;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      instance = L.map(container.current, { scrollWheelZoom: false, zoomSnap: 0.25, zoomAnimation: !reducedMotion, fadeAnimation: !reducedMotion });
      map.current = instance;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).on('tileerror', () => { if (!cancelled) setError('Some map tiles could not load. You can still open the landmark links below.'); })
        .addTo(instance);
      manaliLandmarks.forEach((place, index) => {
        const marker = L.marker([place.latitude, place.longitude], {
          icon: L.divIcon({ className: 'manali-map-pin', html: `<span>${String(index + 1).padStart(2, '0')}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] }),
          title: place.name, alt: place.name,
        }).addTo(instance!);
        const popup = document.createElement('strong');
        popup.textContent = place.name;
        marker.bindPopup(popup).on('click', () => setSelected(place.id));
        markers.current[place.id] = marker;
      });
      instance.fitBounds(manaliLandmarks.map(place => [place.latitude, place.longitude] as [number, number]), { padding: [40, 40], maxZoom: 13, animate: false });
      resize = new ResizeObserver(() => instance?.invalidateSize({ pan: false }));
      resize.observe(container.current);
      setReady(true);
    }).catch(() => { if (!cancelled) setError('The map could not load. Please use the landmark links below.'); });
    return () => { cancelled = true; resize?.disconnect(); instance?.remove(); map.current = null; markers.current = {}; };
  }, [nearby]);

  useEffect(() => {
    const place = manaliLandmarks.find(item => item.id === selected);
    if (!place || !map.current) return;
    map.current.setView([place.latitude, place.longitude], 15, { animate: false });
    markers.current[place.id]?.openPopup();
    for (const [id, marker] of Object.entries(markers.current)) marker.getElement()?.classList.toggle('is-selected', id === selected);
  }, [selected]);

  return <section ref={section} className="manali-location" aria-labelledby="manali-location-title">
    <div className="manali-location-heading"><div><p className="eyebrow">A FEEL FOR THE PLACE</p><h2 id="manali-location-title">Manali, on your doorstep.</h2></div><p>Get to know the town and the mountain landmarks around it. Choose a place to explore the map.</p></div>
    <div className="manali-location-layout">
      <div className="manali-map-frame"><div ref={container} className="manali-map" role="region" aria-label="Map of Manali showing Mall Road, Hidimba Devi Temple and Atal Tunnel"/>
        {!ready && !error && <div className="manali-map-loading" role="status"><MapPin size={22}/><span>Opening your view of Manali…</span></div>}
        {ready && <button className="manali-map-reset" onClick={() => {
          map.current?.closePopup();
          map.current?.fitBounds(manaliLandmarks.map(place => [place.latitude, place.longitude] as [number, number]), { padding: [40, 40], maxZoom: 13, animate: false });
          setSelected(null); Object.values(markers.current).forEach(marker => marker.getElement()?.classList.remove('is-selected'));
        }}>Show all places</button>}
      </div>
      <div className="manali-landmarks"><p className="manali-landmarks-label">AROUND MANALI</p>{manaliLandmarks.map((place, index) => <article key={place.id} className={selected === place.id ? 'manali-landmark is-selected' : 'manali-landmark'}>
        <button className="manali-landmark-button" disabled={!ready} aria-pressed={selected === place.id} onClick={() => setSelected(place.id)}><span className="manali-landmark-number">{String(index + 1).padStart(2, '0')}</span><span><small>{place.category}</small><strong>{place.name}</strong></span><MapPin size={17}/></button>
        <p>{place.description}</p><a href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`} target="_blank" rel="noopener noreferrer">Open in Maps <ArrowUpRight size={13}/><span className="sr-only"> (opens in a new tab)</span></a>
      </article>)}</div>
    </div>
    {error && <p className="manali-map-error" role="status">{error}</p>}
    <p className="manali-location-note"><MapPin size={14}/>Landmark pins are approximate area references, not the property’s exact location. Ask us for a location briefing and viewing arrangements.</p>
  </section>;
}
