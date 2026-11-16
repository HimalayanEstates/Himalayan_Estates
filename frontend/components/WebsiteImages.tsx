"use client";

import { useRef, useState } from "react";
import { imageSlots, defaultSiteImages, validImageUrl, type SiteImages } from "@/lib/site-images";

type Row = Record<string, unknown>;
export default function WebsiteImages({ initial, request, save }: { initial: Row; request: (path: string, method?: string, body?: unknown) => Promise<Row>; save: (images: SiteImages) => Promise<void> }) {
  const [images, setImages] = useState<SiteImages>(() => ({ ...defaultSiteImages, ...initial } as SiteImages));
  const [page, setPage] = useState("All pages");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef("");
  function update(key: string, values: Partial<SiteImages[string]>) { setImages(current => ({ ...current, [key]: { ...current[key], ...values } })); setDirty(true); setNotice(""); }
  async function upload(file: File | undefined) {
    const key = uploadTarget.current;
    if (!file || !key) return;
    setError(""); setNotice("");
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > 10 * 1024 * 1024) { setError("Choose a JPG, PNG, WebP or AVIF image under 10 MB."); return; }
    setBusy(key);
    try {
      const signed = await request("admin/media/signature", "POST", { purpose: "website" });
      if (!/^[a-z0-9-]+$/i.test(String(signed.cloudName))) throw new Error("Cloudinary is not configured correctly.");
      const form = new FormData(); form.append("file", file);
      for (const [field, value] of Object.entries({ api_key: signed.apiKey, timestamp: signed.timestamp, folder: signed.folder, signature: signed.signature })) form.append(field, String(value));
      const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || !result.secure_url || !validImageUrl(result.secure_url)) throw new Error(result.error?.message || "Upload failed. Please try again.");
      update(key, { url: result.secure_url }); setNotice("Image uploaded. Publish image changes to update the website.");
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to upload image."); }
    finally { setBusy(null); if (picker.current) picker.current.value = ""; }
  }
  return <div className="crm-images-workspace">
    <div className="crm-panel crm-panel-heading"><div><h2>Every page. Every image.</h2><p className="crm-muted">Replace page backgrounds and editorial photography. Listing galleries are managed under Properties.</p></div><button className="button" disabled={!!busy || !dirty} onClick={async () => {
      setBusy("publish"); setError(""); setNotice("");
      try { for (const image of Object.values(images)) if (image.url && !validImageUrl(image.url)) throw new Error("Use an HTTPS image URL or a local /images/ path."); await save(images); setDirty(false); setNotice("Website images published successfully."); }
      catch (error) { setError(error instanceof Error ? error.message : "Unable to publish images."); }
      finally { setBusy(null); }
    }}>{busy === "publish" ? "Publishing…" : "Publish image changes"}</button></div>
    <div className="crm-image-toolbar"><label>Page<select aria-label="Filter images by page" value={page} onChange={event => setPage(event.target.value)}>{["All pages", ...Array.from(new Set(imageSlots.map(slot => slot.page)))].map(name => <option key={name}>{name}</option>)}</select></label><label>Search images<input placeholder="Search page or placement…" value={query} onChange={event => setQuery(event.target.value)}/></label></div>
    {error && <p role="alert" className="error-text">{error}</p>}{notice && <p role="status" className="admin-notice">{notice}</p>}
    <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={event => void upload(event.target.files?.[0])}/>
    <div className="crm-image-grid">{imageSlots.filter(slot => (page === "All pages" || page === slot.page) && `${slot.page} ${slot.label}`.toLowerCase().includes(query.toLowerCase())).map(slot => {
      const image = images[slot.key]; const src = image.url || slot.fallback;
      return <article key={slot.key} className="crm-image-card"><div className="crm-image-preview"><img src={validImageUrl(src) ? src : slot.fallback} alt={image.alt} loading="lazy"/><span>{slot.page}</span></div><div className="crm-image-fields"><div className="crm-panel-heading"><h3>{slot.label}</h3><span className="status-label">{image.active ? "Visible" : "Hidden"}</span></div><label>Image URL<input disabled={!!busy} value={image.url} placeholder={slot.fallback} onChange={event => update(slot.key, { url: event.target.value })}/></label><label>Image description<input disabled={!!busy} maxLength={200} value={image.alt} onChange={event => update(slot.key, { alt: event.target.value })}/></label><label className="crm-check"><input type="checkbox" disabled={!!busy} checked={image.active} onChange={event => update(slot.key, { active: event.target.checked })}/>Show this image</label><div className="admin-dialog-actions"><button className="button" disabled={!!busy} onClick={() => { uploadTarget.current = slot.key; picker.current?.click(); }}>{busy === slot.key ? "Uploading…" : "Upload replacement"}</button><button className="text-button" disabled={!!busy} onClick={() => update(slot.key, defaultSiteImages[slot.key])}>Reset image</button></div></div></article>;
    })}</div>
  </div>;
}
