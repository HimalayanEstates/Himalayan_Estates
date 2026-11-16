"use client";

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, MapPin, X } from 'lucide-react';
import { ApiMedia } from '@/lib/api';

export default function PropertyGallery({ media, title, emptyTitle, emptyBody }: { media: ApiMedia[]; title: string; emptyTitle: string; emptyBody: string }) {
  const photos = media.filter(item => !item.mediaType || item.mediaType === 'IMAGE').sort((a, b) => Number(b.isCover) - Number(a.isCover));
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (selected !== null) dialog.current?.showModal(); else dialog.current?.close(); }, [selected]);
  const active = selected === null ? null : photos[selected];
  const move = (direction: number) => setSelected(index => index === null ? null : (index + direction + photos.length) % photos.length);
  if (!photos.length) return <div className="estate-gallery-empty"><MapPin size={28}/><h3>{emptyTitle}</h3><p>{emptyBody}</p><a className="text-link" href="#contact">Request the property brief <ArrowUpRight size={15}/></a></div>;
  return <>
    <div className={`estate-photo-grid${photos.length === 1 ? ' estate-photo-single' : ''}`}>
      {photos.slice(0, 5).map((photo, index) => <button key={`${photo.deliveryUrl}-${index}`} className={`estate-photo estate-photo-${index}`} onClick={() => setSelected(index)} aria-label={`View photograph ${index + 1} of ${title}`}>
        <img src={photo.deliveryUrl} alt={photo.altText} width={index === 0 ? 1400 : 900} height={900} loading="lazy"/>
        <span className="estate-photo-caption"><small>PHOTOGRAPH {String(index + 1).padStart(2, '0')}</small><span>{photo.caption || photo.altText}</span></span>
        <span className="estate-photo-open"><ArrowUpRight size={19}/></span>
      </button>)}
    </div>
    <button className="text-link estate-gallery-all" onClick={() => setSelected(0)}>View all {photos.length} photographs <ArrowUpRight size={16}/></button>
    <dialog ref={dialog} className="estate-photo-dialog" aria-label={`Photography of ${title}`} onCancel={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) setSelected(null); }} onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
    }}>
      <div className="estate-photo-dialog-header"><span>{title}</span><button type="button" aria-label="Close photographs" onClick={() => setSelected(null)}><X size={23}/></button></div>
      {active && <img src={active.deliveryUrl} alt={active.altText} width={1800} height={1200}/>}
      <div className="estate-photo-dialog-footer"><p aria-live="polite">{(selected ?? 0) + 1} / {photos.length} · {active?.caption || active?.altText}</p><div><button type="button" aria-label="Previous photograph" disabled={photos.length < 2} onClick={() => move(-1)}><ArrowLeft size={20}/></button><button type="button" aria-label="Next photograph" disabled={photos.length < 2} onClick={() => move(1)}><ArrowLeft className="arrow-icon-right" size={20}/></button></div></div>
    </dialog>
  </>;
}
