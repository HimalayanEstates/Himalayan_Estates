"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Building2, Inbox, ListChecks, Clock3 } from "lucide-react";
import { sitePageDefaults, type SitePageSlug } from "@/lib/site-page-defaults";

type Row = Record<string, unknown>;
type Request = (path: string, method?: string, body?: unknown) => Promise<Row>;
const label = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/^./, s => s.toUpperCase());
const rows = (value: unknown): Row[] => Array.isArray(value) ? value : [];
const text = (value: unknown) => typeof value === "string" ? value : "";

export function Dashboard({ data, navigate }: { data: Row; navigate: (path: string) => void }) {
  const metrics = (data.metrics ?? {}) as Row;
  const counts = (data.inquiryCounts ?? {}) as Record<string, number>;
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const cards = [
    { name: "Live properties", value: metrics.publishedProperties, icon: Building2, path: "properties" },
    { name: "Total inquiries", value: total, icon: Inbox, path: "inquiries" },
    { name: "Open follow-ups", value: metrics.openTasks, icon: ListChecks, path: "crm/tasks" },
    { name: "Due follow-ups", value: metrics.dueTasks, icon: Clock3, path: "crm/tasks" },
  ];
  return <>
    <div className="crm-metrics">{cards.map(card => <button key={card.name} className="crm-metric" onClick={() => navigate(card.path)}><span className="crm-icon"><card.icon size={20}/></span><strong>{Number(card.value ?? 0).toLocaleString("en-IN")}</strong><span>{card.name}</span><ArrowUpRight className="crm-card-arrow" size={16}/></button>)}</div>
    <div className="crm-dashboard-grid">
      <section className="crm-panel"><div className="crm-panel-heading"><div><p className="eyebrow">YOUR SALES PIPELINE</p><h2>Every conversation counts.</h2></div><button className="text-button" onClick={() => navigate("inquiries")}>View inquiries ↗</button></div>
        <p className="crm-muted">{total} inquiries across all stages. Follow up with new contacts and keep each conversation moving.</p>
        {total ? <div className="crm-pipeline">{Object.entries(counts).map(([status, count]) => <div key={status}><div><span>{label(status.toLowerCase())}</span><strong>{count}</strong></div><progress aria-label={`${label(status.toLowerCase())} inquiries`} value={count} max={total}/></div>)}</div> : <p className="crm-empty">Your first website inquiry will appear here.</p>}
      </section>
      <section className="crm-panel crm-quick"><p className="eyebrow">MAKE IT YOURS</p><h2>A website that stays current.</h2><p>Edit your story, update services and keep your collection ready for its next owner.</p><button className="button" onClick={() => navigate("cms/pages")}>Edit website content <ArrowUpRight size={16}/></button><button className="text-button" onClick={() => navigate("properties")}>Manage the property collection ↗</button></section>
    </div>
    <section className="crm-panel"><div className="crm-panel-heading"><h2>Recent conversations</h2><button className="text-button" onClick={() => navigate("inquiries")}>View all ↗</button></div>{rows(data.recentInquiries).length ? <div className="crm-recent">{rows(data.recentInquiries).map(inquiry => <div key={text(inquiry.id)}><span className="crm-avatar">{text(inquiry.requesterName).slice(0, 1)}</span><div><strong>{text(inquiry.requesterName)}</strong><p>{text(inquiry.message).slice(0, 120)}</p></div><span className="status-label">{label(text(inquiry.status).toLowerCase())}</span></div>)}</div> : <p className="crm-empty">No inquiries yet. Messages submitted through the website will be listed here.</p>}</section>
  </>;
}

function merge(base: unknown, value: unknown): unknown {
  if (Array.isArray(base)) return Array.isArray(value) ? value : base;
  if (base && typeof base === "object") {
    const current = value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
    return { ...current, ...Object.fromEntries(Object.entries(base as Row).map(([key, item]) => [key, merge(item, current[key])])) };
  }
  return value === undefined ? base : value;
}

function ContentFields({ value, onChange, name, template }: { value: unknown; onChange: (value: unknown) => void; name: string; template?: unknown }) {
  const itemTemplate = useRef(Array.isArray(template) ? template[0] : Array.isArray(value) ? value[0] : undefined);
  if (Array.isArray(value)) return <fieldset className="crm-field-group"><legend>{label(name)}</legend>{value.map((item, index) => <div className="crm-repeat-item" key={index}><ContentFields name={`${name} ${index + 1}`} template={itemTemplate.current} value={item} onChange={next => onChange(value.map((entry, i) => i === index ? next : entry))}/><button type="button" className="text-button" onClick={() => onChange(value.filter((_, i) => i !== index))}>Remove item {index + 1}</button></div>)}{itemTemplate.current !== undefined && <button type="button" className="text-button" onClick={() => onChange([...value, JSON.parse(JSON.stringify(itemTemplate.current))])}>+ Add {label(name).toLowerCase()} item</button>}</fieldset>;
  if (value && typeof value === "object") return <fieldset className="crm-field-group"><legend>{label(name)}</legend>{Object.entries(value as Row).map(([key, item]) => <ContentFields key={key} name={key} template={template && typeof template === "object" ? (template as Row)[key] : undefined} value={item} onChange={next => onChange({ ...(value as Row), [key]: next })}/>)}</fieldset>;
  if (typeof value === "boolean") return <label className="crm-check"><input type="checkbox" checked={value} onChange={event => onChange(event.target.checked)}/>{label(name)}</label>;
  const long = typeof value === "string" && (value.length > 90 || /body|intro|description|note|disclaimer/i.test(name));
  return <label>{label(name)}{long ? <textarea rows={3} value={String(value ?? "")} onChange={event => onChange(event.target.value)}/> : <input type={typeof value === "number" ? "number" : "text"} value={String(value ?? "")} onChange={event => onChange(typeof value === "number" ? Number(event.target.value) : event.target.value)}/>}</label>;
}

export function PageEditor({ page, saving, onPublish }: { page: Row; saving: boolean; onPublish: (event: FormEvent<HTMLFormElement>) => Promise<void> }) {
  const slug = text(page.slug) as SitePageSlug;
  const [sections, setSections] = useState(() => merge(sitePageDefaults[slug] ?? {}, page.sections));
  const [dirty, setDirty] = useState(false);
  return <form className="crm-page-editor" onSubmit={onPublish} onChange={() => setDirty(true)}>
    <input name="isNew" type="hidden" value={String(page.isNew ?? false)}/><input name="slug" type="hidden" value={slug}/><input name="sections" type="hidden" value={JSON.stringify(sections)}/>
    <div className="crm-panel-heading"><div><p className="eyebrow">{page.isNew ? "READY TO PERSONALISE" : text(page.status) || "WEBSITE PAGE"}</p><h2>{text(page.title)}</h2></div><a className="text-button" href={slug === "home" || slug === "global" ? "/" : slug === "property-detail" ? "/properties" : `/${slug}`} target="_blank" rel="noopener noreferrer">Open page ↗</a></div>
    <label>Page title<input name="title" defaultValue={text(page.title)} required maxLength={180}/></label>
    <ContentFields name="Page content" template={sitePageDefaults[slug]} value={sections} onChange={value => { setSections(value); setDirty(true); }}/>
    <div className="crm-editor-footer"><p>{dirty ? "You have unpublished changes." : "Changes go live when you publish."}</p><button className="button" disabled={saving}>{saving ? "Publishing…" : "Save and publish"}</button></div>
  </form>;
}

export function AboutEditor({ page, saving, onPublish }: { page: Row; saving: boolean; onPublish: (event: FormEvent<HTMLFormElement>) => Promise<void> }) {
  const [content, setContent] = useState(() => merge(sitePageDefaults.about, page.sections) as typeof sitePageDefaults.about);
  const [tab, setTab] = useState("Content");
  return <form className="crm-page-editor" onSubmit={onPublish}>
    <input name="isNew" type="hidden" value={String(page.isNew ?? false)}/><input name="slug" type="hidden" value="about"/><input name="title" type="hidden" value={text(page.title)}/><input name="sections" type="hidden" value={JSON.stringify(content)}/>
    <div className="crm-panel-heading"><h2>About Himalayan Estates</h2><a className="text-button" href="/about" target="_blank" rel="noopener noreferrer">Open page ↗</a></div>
    <div className="crm-about-tabs" role="tablist" aria-label="About page sections">{["Content", "Mission & Vision", "Values", "Stats"].map(name => <button type="button" role="tab" aria-selected={tab === name} aria-controls="about-editor-panel" id={`about-tab-${name.replace(/\W/g, "")}`} key={name} onClick={() => setTab(name)}>{name}</button>)}</div>
    <div id="about-editor-panel" role="tabpanel" aria-labelledby={`about-tab-${tab.replace(/\W/g, "")}`}>
      {tab === "Content" && <>{(["hero", "story", "approach"] as const).map(key => <ContentFields key={key} name={key} value={content[key]} onChange={value => setContent(current => ({ ...current, [key]: value }))}/>)}<ContentFields name="Milestones heading" value={{ title: content.work.title, intro: content.work.intro }} onChange={value => setContent(current => ({ ...current, work: { ...current.work, ...(value as Row) } }))}/></>}
      {tab === "Mission & Vision" && <ContentFields name="Mission & vision" value={content.missionVision} onChange={value => setContent(current => ({ ...current, missionVision: value as typeof content.missionVision }))}/>}
      {tab === "Values" && <ContentFields name="Values" value={content.values} template={sitePageDefaults.about.values} onChange={value => setContent(current => ({ ...current, values: value as typeof content.values }))}/>}
      {tab === "Stats" && <div className="crm-stats-editor"><p className="crm-muted">Set your own milestones. Numbers animate when visitors scroll into view.</p>{content.stats.map((stat, index) => <div className="crm-stat-row" key={index}><label>Label<input required maxLength={100} value={stat.label} onChange={event => { const label = event.target.value; setContent(current => ({ ...current, stats: current.stats.map((item, i) => i === index ? { ...item, label } : item) })); }}/></label><label>Value<input required type="number" min={0} max={1000000000} step={1} value={stat.value} onChange={event => { const value = Number(event.target.value); setContent(current => ({ ...current, stats: current.stats.map((item, i) => i === index ? { ...item, value } : item) })); }}/></label><label>Suffix<input maxLength={12} value={stat.suffix} onChange={event => { const suffix = event.target.value; setContent(current => ({ ...current, stats: current.stats.map((item, i) => i === index ? { ...item, suffix } : item) })); }}/></label><button type="button" className="text-button admin-delete-button" aria-label={`Remove ${stat.label || "stat"}`} onClick={() => setContent(current => ({ ...current, stats: current.stats.filter((_, i) => i !== index) }))}>Remove</button></div>)}<button className="text-button" type="button" onClick={() => setContent(current => ({ ...current, stats: [...current.stats, { label: "New milestone", value: 0, suffix: "+" }] }))}>+ Add stat</button></div>}
    </div>
    <div className="crm-editor-footer"><p>Publish to update the About page.</p><button className="button" disabled={saving}>{saving ? "Publishing…" : "Save and publish"}</button></div>
  </form>;
}

export function Conversations({ items, request, reload }: { items: Row[]; request: Request; reload: () => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    const form = new FormData(event.currentTarget); setBusy(true); setError("");
    try {
      await request(`admin/inquiries/${selected.id}`, "PATCH", { status: form.get("status"), internalNotes: form.get("notes"), nextFollowUpAt: form.get("followUp") ? new Date(String(form.get("followUp"))).toISOString() : null });
      if (form.get("task")) await request("admin/crm/tasks", "POST", { inquiryId: selected.id, title: form.get("task"), dueAt: form.get("followUp") ? new Date(String(form.get("followUp"))).toISOString() : null });
      setSelected(null); await reload();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to save inquiry."); } finally { setBusy(false); }
  }
  return <section className="crm-panel"><div className="crm-panel-heading"><h2>Inquiry inbox</h2><input className="crm-search" aria-label="Search inquiries" placeholder="Search name, email or message…" value={query} onChange={e => setQuery(e.target.value)}/></div>
    {error && <p role="alert" className="error-text">{error}</p>}
    {selected ? <form key={text(selected.id)} className="crm-inquiry-editor" onSubmit={save}><h3>{text(selected.requesterName)}</h3><p>{text(selected.email)} · {text(selected.phone)}</p><blockquote>{text(selected.message)}</blockquote><label>Status<select name="status" defaultValue={text(selected.status)}>{["NEW", "CONTACTED", "QUALIFIED", "VISIT_SCHEDULED", "WON", "LOST", "SPAM"].map(status => <option key={status}>{status}</option>)}</select></label><label>Internal notes<textarea name="notes" rows={4} maxLength={5000} defaultValue={text(selected.internalNotes)}/></label><label>Follow-up date<input type="datetime-local" name="followUp" defaultValue={selected.nextFollowUpAt ? localDate(text(selected.nextFollowUpAt)) : ""}/></label><label>Create a follow-up task (optional)<input name="task" maxLength={200} placeholder="e.g. Arrange a property viewing"/></label><div className="admin-dialog-actions"><button type="button" className="text-button" disabled={busy} onClick={() => setSelected(null)}>Back to inbox</button><button className="button" disabled={busy}>{busy ? "Saving…" : "Save conversation"}</button></div></form> : <div className="table-scroll" tabIndex={0} role="region" aria-label="Inquiry inbox"><table><thead><tr><th>Contact</th><th>Message</th><th>Status</th><th>Action</th></tr></thead><tbody>{items.filter(item => [item.requesterName, item.email, item.phone, item.message].join(" ").toLowerCase().includes(query.toLowerCase())).map(item => <tr key={text(item.id)}><td><strong>{text(item.requesterName)}</strong><small className="table-subline">{text(item.email) || text(item.phone)}</small></td><td>{text(item.message).slice(0, 90)}</td><td><span className="status-label">{text(item.status).replaceAll("_", " ")}</span></td><td><button className="text-button" onClick={() => { setError(""); setSelected(item); }}>Manage inquiry</button></td></tr>)}</tbody></table>{!items.length && <p className="crm-empty">No inquiries yet.</p>}</div>}
  </section>;
}

function localDate(value: string) { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }

export function Tasks({ items, request, reload }: { items: Row[]; request: Request; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  return <section className="crm-panel"><div className="crm-panel-heading"><h2>Follow-up workspace</h2><p className="crm-muted">Create tasks from an inquiry in your inbox.</p></div>{error && <p role="alert" className="error-text">{error}</p>}<div className="crm-task-list">{items.map(item => <div key={text(item.id)}><ListChecks size={22}/><div><strong>{text(item.title)}</strong><p>{text(item.notes)}</p><small>{item.dueAt ? new Date(text(item.dueAt)).toLocaleString("en-IN") : "No due date"}</small></div><label><span className="sr-only">Status for {text(item.title)}</span><select disabled={busy === item.id} value={text(item.status)} onChange={async event => { const status = event.target.value; setBusy(text(item.id)); setError(""); try { await request(`admin/crm/tasks/${item.id}`, "PATCH", { status }); await reload(); } catch (error) { setError(error instanceof Error ? error.message : "Unable to update task."); } finally { setBusy(null); } }}>{["OPEN", "COMPLETED", "CANCELLED"].map(status => <option key={status}>{status}</option>)}</select></label></div>)}</div>{!items.length && <p className="crm-empty">All clear. Add a follow-up from an inquiry to plan your next conversation.</p>}</section>;
}
