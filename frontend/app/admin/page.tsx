"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import SiteLogo from "@/components/SiteLogo";
import { LayoutDashboard, Building2, Inbox, ListChecks, PanelsTopLeft, Settings2, History, LogOut, ArrowUpRight, RefreshCw, Menu, X } from "lucide-react";
import { Dashboard, PageEditor, AboutEditor, Conversations, Tasks } from "@/components/AdminWorkspace";
import WebsiteImages from "@/components/WebsiteImages";
import "./admin.css";
import { API_BASE_URL } from "@/lib/api";
import { sitePageDefaults, sitePageTitles, siteSettingDefaults, type SitePageSlug } from "@/lib/site-page-defaults";

type Row = Record<string, unknown>;
type ApiResult = Row & { error?: { message?: string } };

const PROPERTY_CATEGORIES = [
  "HOTEL",
  "LAND",
  "HOUSE_VILLA",
  "APARTMENT",
  "COMMERCIAL",
  "RESORT",
  "FARM",
  "OTHER",
] as const;
const tabIcons = [LayoutDashboard, Building2, Inbox, ListChecks, PanelsTopLeft, Settings2, History, PanelsTopLeft];

const PROPERTY_PURPOSES = ["SALE", "LEASE", "RENT", "SALE_OR_LEASE"] as const;
const PRICE_MODES = ["FIXED", "NEGOTIABLE", "PRICE_ON_REQUEST", "RANGE"] as const;

const tabs = [
  ["crm/dashboard", "Overview"],
  ["properties", "Properties"],
  ["inquiries", "Inquiries"],
  ["crm/tasks", "Follow-up tasks"],
  ["cms/pages", "Website content"],
  ["cms/settings", "Site settings"],
  ["audit-events", "Activity log"],
  ["website-images", "Website images"],
] as const;

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [view, setView] = useState("crm/dashboard");
  const [data, setData] = useState<Row | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobileNav) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = sidebar.current;
    panel?.querySelector<HTMLButtonElement>(".crm-drawer-close")?.focus();
    const close = () => { setMobileNav(false); menuButton.current?.focus(); };
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const elements = panel?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]');
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    const desktop = window.matchMedia("(min-width: 761px)");
    const resized = () => { if (desktop.matches) close(); };
    document.addEventListener("keydown", keys); desktop.addEventListener("change", resized);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", keys); desktop.removeEventListener("change", resized); };
  }, [mobileNav]);
  const [editingProperty, setEditingProperty] = useState<Row | null>(null);
  const [creatingProperty, setCreatingProperty] = useState(false);
  const [selectedPage, setSelectedPage] = useState<SitePageSlug>("home");
  const loadSequence = useRef(0);
  const createdPages = useRef(new Set<string>());

  async function request(path: string, method = "GET", body?: unknown): Promise<ApiResult> {
    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method,
      credentials: "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = (await response.json()) as ApiResult;
    if (!response.ok) throw new Error(result.error?.message ?? "Request failed.");
    return result;
  }

  async function load(path: string, page = 1) {
    setMobileNav(false);
    const sequence = ++loadSequence.current;
    setView(path);
    setBusy(true);
    setNotice("");
    setData(null);
    setEditingProperty(null);
    setCreatingProperty(false);
    try {
      const result = await request(`admin/${path === "website-images" ? "cms/pages" : path}${path === "properties" || path === "inquiries" || path === "audit-events" ? `?page=${page}` : ""}`);
      if (sequence !== loadSequence.current) return;
      const pages = Array.isArray(result.pages) ? (result.pages as Row[]) : [];
      if (path === "cms/pages") {
        for (const slug of (Object.keys(sitePageDefaults) as SitePageSlug[]).filter(slug => slug !== "images")) {
          if (!pages.some((page) => page.slug === slug)) {
            pages.push({ id: `template-${slug}`, slug, title: sitePageTitles[slug], sections: sitePageDefaults[slug], isNew: true });
          }
        }
        pages.sort((left, right) => String(left.slug).localeCompare(String(right.slug)));
      }
      if (path === "cms/pages") result.pages = pages;
      setData(result);
    } catch (error) {
      if (sequence === loadSequence.current) setNotice(error instanceof Error ? error.message : "Unable to load this section.");
    } finally {
      if (sequence === loadSequence.current) setBusy(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setNotice("");
    try {
      await request("auth/sign-in", "POST", { email: form.get("email"), password: form.get("password") });
      setAuthenticated(true);
      await load(view);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function publishPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (publishing) return;
    const form = new FormData(event.currentTarget);
    setPublishing(true);
    setNotice("");
    try {
      const slug = String(form.get("slug"));
      const encodedSlug = encodeURIComponent(slug);
      const title = String(form.get("title"));
      const sections = JSON.parse(String(form.get("sections")));
      if (form.get("isNew") === "true" && !createdPages.current.has(slug)) {
        await request("admin/cms/pages", "POST", { slug, title, sections });
        createdPages.current.add(slug);
      }
      await request(`admin/cms/pages/${encodedSlug}`, "PATCH", { title, sections });
      await request(`admin/cms/pages/${encodedSlug}?action=publish`, "POST");
      window.dispatchEvent(new Event("site-data-updated"));
      await load("cms/pages");
      setNotice("Page published successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to publish this page.");
    } finally {
      setPublishing(false);
    }
  }

  async function signOut() {
    setMobileNav(false);
    try {
      await request("auth/sign-out", "POST");
      setAuthenticated(false);
      setData(null);
      setNotice("");
    } catch {
      setNotice("Unable to sign out. Try again.");
    }
  }

  const propertyRows = Array.isArray(data?.items) ? (data.items as Row[]) : [];

  return (
    <main className="admin-shell" id="main-content">
      <div className="crm-mobile-header">{authenticated && <button ref={menuButton} type="button" aria-label="Open admin menu" aria-expanded={mobileNav} aria-controls="admin-navigation" onClick={() => setMobileNav(true)}><Menu size={23}/></button>}<Link href="/" className="brand brand-logo" aria-label="Himalayan Estates home"><SiteLogo priority/></Link></div>
      {mobileNav && <button type="button" className="crm-drawer-backdrop" aria-label="Close admin menu" tabIndex={-1} onClick={() => { setMobileNav(false); menuButton.current?.focus(); }}/ >}
      <aside ref={sidebar} id="admin-navigation" role={mobileNav ? "dialog" : undefined} aria-modal={mobileNav || undefined} className={`admin-sidebar${mobileNav ? " is-open" : ""}`} aria-label="Admin navigation">
        <button className="crm-drawer-close" type="button" aria-label="Close admin menu" onClick={() => { setMobileNav(false); menuButton.current?.focus(); }}><X size={22}/></button>
        <Link className="brand brand-logo" href="/" aria-label="Himalayan Estates home"><SiteLogo priority/></Link>
        {authenticated && (
          <nav aria-label="Admin sections">
            <p className="crm-nav-label">WORKSPACE</p>
            {tabs.map(([path, label], index) => {
              const Icon = tabIcons[index];
              return <button key={path} aria-current={path === view ? "page" : undefined} className={path === view ? "active" : ""} onClick={() => void load(path)}><Icon size={18}/>{label}</button>;
            })}
            <p className="crm-nav-label">ACCOUNT</p>
            <button onClick={() => void signOut()}><LogOut size={18}/>Sign out</button>
          </nav>
        )}
        <Link className="crm-site-link" href="/" target="_blank">View website <ArrowUpRight size={16}/></Link>
        <div className="crm-sidebar-note">MANALI, HIMACHAL PRADESH<br/>Your local property workspace.</div>
      </aside>

      <section className="admin-main" aria-live="polite">
        <header className="crm-topbar"><div><p className="eyebrow">HIMALAYAN ESTATES / ADMINISTRATION</p><h1>{authenticated ? tabs.find(([path]) => path === view)?.[1] : "Welcome back."}</h1><p className="crm-muted">{authenticated ? "A clear view of your properties, people and website." : "Your collection. Your conversations. One place."}</p></div>{authenticated && <button className="crm-refresh" disabled={busy} onClick={() => void load(view)}><RefreshCw size={16}/>Refresh</button>}</header>
        {notice && <p role="status" className="admin-notice">{notice}</p>}

        {!authenticated ? (
          <form className="login-form" onSubmit={login}>
            <p>Sign in with your administrator account.</p>
            <label>Email<input name="email" type="email" autoComplete="username" required /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
            <button className="button" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</button>
          </form>
        ) : busy ? (
          <div className="crm-loading" role="status"><span/>Loading your workspace…</div>
        ) : data ? (
          view === "properties" ? (
            <PropertyManager
              rows={propertyRows}
              editing={editingProperty}
              creating={creatingProperty}
              onCreate={() => { setEditingProperty(null); setCreatingProperty(true); }}
              onEdit={(property) => { setCreatingProperty(false); setEditingProperty(property); }}
              onCancel={() => { setEditingProperty(null); setCreatingProperty(false); }}
              onDelete={async (property) => {
                await request(`admin/properties/${encodeURIComponent(String(property.id))}`, "DELETE");
                await load("properties");
                setNotice("Property deleted from the website.");
              }}
              onSaved={async () => { setEditingProperty(null); setCreatingProperty(false); await load("properties"); }}
            />
          ) : view === "cms/pages" ? (
            <div className="crm-content-layout"><nav className="crm-page-tabs" aria-label="Website pages">{(Array.isArray(data.pages) ? data.pages as Row[] : []).filter(page => page.slug !== "images").map(page => <button key={String(page.slug)} className={selectedPage === page.slug ? "active" : ""} aria-pressed={selectedPage === page.slug} onClick={() => setSelectedPage(page.slug as SitePageSlug)}>{String(page.title)}<small>{page.isNew ? "Template" : String(page.status).toLowerCase()}</small></button>)}</nav>{(Array.isArray(data.pages) ? data.pages as Row[] : []).filter(page => page.slug === selectedPage).map(page => page.slug === "about" ? <AboutEditor key={String(page.id)} page={page} saving={publishing} onPublish={publishPage}/> : <PageEditor key={String(page.id)} page={page} saving={publishing} onPublish={publishPage}/>)}</div>
          ) : view === "website-images" ? (
            <WebsiteImages initial={((Array.isArray(data.pages) ? data.pages as Row[] : []).find(page => page.slug === "images")?.sections ?? {}) as Row} request={request} save={async images => {
              const exists = (Array.isArray(data.pages) ? data.pages as Row[] : []).some(page => page.slug === "images");
              if (!exists && !createdPages.current.has("images")) {
                await request("admin/cms/pages", "POST", { slug: "images", title: "Website images", sections: images });
                createdPages.current.add("images");
              } else { await request("admin/cms/pages/images", "PATCH", { title: "Website images", sections: images }); }
              await request("admin/cms/pages/images?action=publish", "POST");
              window.dispatchEvent(new Event("site-data-updated"));
            }}/>
          ) : view === "cms/settings" ? (
            <SettingsManager rows={Array.isArray(data.settings) ? data.settings as Row[] : []} onSave={async (settingKey, value) => {
              await request("admin/cms/settings", "PUT", { settingKey, value });
              window.dispatchEvent(new Event("site-data-updated"));
              setNotice(`${settingKey} saved.`);
            }} />
          ) : view === "crm/dashboard" ? <Dashboard data={data} navigate={path => void load(path)}/>
          : view === "inquiries" ? <Conversations items={Array.isArray(data.items) ? data.items as Row[] : []} request={request} reload={() => load("inquiries")}/>
          : view === "crm/tasks" ? <Tasks items={Array.isArray(data.tasks) ? data.tasks as Row[] : []} request={request} reload={() => load("crm/tasks")}/>
          : (
            <>
              <Records rows={data.recentInquiries ?? data.items ?? data.tasks ?? data.events ?? []} />
            </>
          )
        ) : null}
        {authenticated && !busy && data?.pagination != null && Number((data.pagination as Row).totalPages) > 1 && <div className="pagination"><button className="crm-refresh" disabled={Number((data.pagination as Row).page) <= 1} onClick={() => void load(view, Number((data.pagination as Row).page) - 1)}>Previous</button><span>Page {Number((data.pagination as Row).page)} of {Number((data.pagination as Row).totalPages)}</span><button className="crm-refresh" disabled={Number((data.pagination as Row).page) >= Number((data.pagination as Row).totalPages)} onClick={() => void load(view, Number((data.pagination as Row).page) + 1)}>Next</button></div>}
      </section>
    </main>
  );
}

function PropertyManager({
  rows,
  editing,
  creating,
  onCreate,
  onEdit,
  onCancel,
  onDelete,
  onSaved,
}: {
  rows: Row[];
  editing: Row | null;
  creating: boolean;
  onCreate: () => void;
  onEdit: (property: Row) => void;
  onCancel: () => void;
  onDelete: (property: Row) => Promise<void>;
  onSaved: () => Promise<void>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const deleteDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (deleteTarget) deleteDialog.current?.showModal();
    else deleteDialog.current?.close();
  }, [deleteTarget]);

  return (
    <div className="property-manager">
      <div className="admin-list-heading">
        <div><h2>Property inventory</h2><p>{rows.length} recently updated listings</p></div>
        {!creating && !editing && <button className="button" onClick={onCreate}>Create a listing</button>}
      </div>

      {(creating || editing) && (
        <PropertyEditor key={String(editing?.id ?? "new-listing")} property={editing} onCancel={onCancel} onSaved={onSaved} />
      )}

      {!creating && !editing && (
        rows.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Property</th><th>Category</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {rows.map((property, index) => (
                  <tr key={String(property.id ?? index)}>
                    <td><strong>{displayValue(property.title)}</strong><small className="table-subline">/{displayValue(property.slug)}</small></td>
                    <td>{displayValue(property.category).replaceAll("_", " ")}</td>
                    <td>{displayValue(property.locality)}, {displayValue(property.city)}</td>
                    <td><span className="status-label">{displayValue(property.status).replaceAll("_", " ")}</span></td>
                    <td className="admin-property-actions">
                      <button className="text-button" onClick={() => onEdit(property)}>Edit details</button>
                      <button
                        className="text-button admin-delete-button"
                        disabled={deletingId === String(property.id)}
                        onClick={() => { setDeleteError(""); setDeleteTarget(property); }}
                      >{deletingId === String(property.id) ? "Deleting…" : "Delete"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><h2>No listings yet.</h2><p>Create a draft to start building the Manali collection.</p><button className="button" onClick={onCreate}>Create the first listing</button></div>
        )
      )}
      <p className="admin-help">New listings are saved as drafts. Add and approve a cover image before publishing.</p>
      <dialog ref={deleteDialog} className="admin-delete-dialog" aria-labelledby="delete-property-title" aria-describedby="delete-property-description" onCancel={(event) => {
        if (deletingId) event.preventDefault();
        else setDeleteTarget(null);
      }}>
        <p className="eyebrow">PROPERTY INVENTORY</p>
        <h2 id="delete-property-title">Delete this property?</h2>
        <p id="delete-property-description"><strong>{displayValue(deleteTarget?.title)}</strong> will be removed from the website. Its records will be kept in the archive.</p>
        {deleteError && <p role="alert" className="admin-delete-error">{deleteError}</p>}
        <div className="admin-dialog-actions">
          <button type="button" className="button admin-dialog-cancel" autoFocus disabled={!!deletingId} onClick={() => setDeleteTarget(null)}>Keep property</button>
          <button type="button" className="button admin-dialog-confirm" disabled={!!deletingId} onClick={async () => {
            if (!deleteTarget || deletingId) return;
            setDeletingId(String(deleteTarget.id));
            setDeleteError("");
            try { await onDelete(deleteTarget); setDeleteTarget(null); }
            catch (error) { setDeleteError(error instanceof Error ? error.message : "Unable to delete this property. Please try again."); }
            finally { setDeletingId(null); }
          }}>{deletingId ? "Deleting…" : "Delete property"}</button>
        </div>
      </dialog>
    </div>
  );
}

const settingLabels: Record<keyof typeof siteSettingDefaults, string> = {
  "site.name": "Website name",
  "site.tagline": "Footer tagline",
  "contact.name": "Broker name",
  "contact.phone": "Phone and WhatsApp number",
  "contact.email": "Contact email",
  "contact.address": "Broker address",
  "social.instagram": "Instagram URL",
  "social.facebook": "Facebook URL",
};

function SettingsManager({ rows, onSave }: { rows: Row[]; onSave: (key: keyof typeof siteSettingDefaults, value: string) => Promise<void> }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = { ...siteSettingDefaults };
    for (const row of rows) {
      if (typeof row.settingKey === "string" && row.settingKey in initial) initial[row.settingKey] = displayValue(row.value);
    }
    return initial;
  });
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function saveSetting(key: keyof typeof siteSettingDefaults) {
    setSavingKey(key);
    setError("");
    try {
      await onSave(key, values[key]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The setting could not be saved.");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <section className="settings-manager" aria-labelledby="settings-title">
      <div className="admin-list-heading"><div><h2 id="settings-title">Website settings</h2><p>Changes update public branding and contact details.</p></div></div>
      {error && <p role="alert" className="error-text">{error}</p>}
      <div className="settings-grid">
        {(Object.keys(siteSettingDefaults) as (keyof typeof siteSettingDefaults)[]).map((key) => (
          <div className="setting-row" key={key}>
            <label htmlFor={`setting-${key}`}>{settingLabels[key]}</label>
            {key === "contact.address" || key === "site.tagline" ? (
              <textarea id={`setting-${key}`} rows={2} maxLength={500} value={values[key]} onChange={(event) => { const value = event.currentTarget.value; setValues((current) => ({ ...current, [key]: value })); }} />
            ) : (
              <input id={`setting-${key}`} type={key === "contact.email" ? "email" : key.startsWith("social.") ? "url" : "text"} maxLength={300} value={values[key]} onChange={(event) => { const value = event.currentTarget.value; setValues((current) => ({ ...current, [key]: value })); }} />
            )}
            <button className="text-button" disabled={savingKey !== null} onClick={() => void saveSetting(key)}>{savingKey === key ? "Saving…" : "Save"}</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function PropertyEditor({ property, onCancel, onSaved }: { property: Row | null; onCancel: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(displayValue(property?.status) || "DRAFT");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isEditing = property !== null;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      const priceMode = String(form.get("priceMode"));
      const minimum = String(form.get("priceMinor") ?? "").trim();
      const maximum = String(form.get("priceMaxMinor") ?? "").trim();
      if (priceMode === "RANGE" && !maximum) throw new Error("Enter a maximum price for a price range.");
      const payload = {
        title: String(form.get("title")).trim(),
        slug: String(form.get("slug")).trim() || undefined,
        category: String(form.get("category")),
        purpose: String(form.get("purpose")),
        description: String(form.get("description")).trim(),
        priceMode,
        priceMinor: minimum ? rupeesToMinorUnits(minimum) : null,
        priceMaxMinor: priceMode === "RANGE" && maximum ? rupeesToMinorUnits(maximum) : null,
        currency: "INR",
        areaValue: String(form.get("areaValue")).trim() ? Number(form.get("areaValue")) : null,
        areaUnit: String(form.get("areaUnit")).trim() || null,
        address: String(form.get("address")).trim() || null,
        locality: String(form.get("locality")).trim(),
        city: "Manali",
        publicLocationPrecise: false,
        amenities: String(form.get("amenities")).split(",").map((item) => item.trim()).filter(Boolean),
      };
      const path = isEditing ? `admin/properties/${encodeURIComponent(String(property.id))}` : "admin/properties";
      await fetchAdminRequest(path, isEditing ? "PATCH" : "POST", payload);
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The listing could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus() {
    if (!property) return;
    const action = status === "PUBLISHED" ? "pause" : "publish";
    setSaving(true);
    setError("");
    try {
      const result = await fetchAdminRequest(`admin/properties/${encodeURIComponent(String(property.id))}/${action}`, "POST", {});
      const updated = result.property as Row | undefined;
      setStatus(displayValue(updated?.status) || (action === "publish" ? "PUBLISHED" : "PAUSED"));
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The listing status could not be changed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form className="property-editor" onSubmit={save} onChange={() => setHasUnsavedChanges(true)}>
        <div className="editor-heading"><div><p className="eyebrow">{isEditing ? "EDIT DRAFT OR LISTING" : "NEW MANALI LISTING"}</p><h2>{isEditing ? displayValue(property.title) : "Property details"}</h2></div><button type="button" className="text-button" onClick={onCancel}>Close editor</button></div>
        {isEditing && <p className="admin-help">Current status: <strong>{status.replaceAll("_", " ")}</strong></p>}
        <div className="editor-grid">
          <label>Listing title<input name="title" minLength={3} maxLength={180} defaultValue={displayValue(property?.title)} required /></label>
          <label>URL slug <span>(optional)</span><input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={160} defaultValue={displayValue(property?.slug)} placeholder="Generated from the title" /></label>
          <label>Property type<select name="category" defaultValue={displayValue(property?.category) || "HOTEL"}>{PROPERTY_CATEGORIES.map((category) => <option key={category} value={category}>{category.replaceAll("_", " ")}</option>)}</select></label>
          <label>Listing purpose<select name="purpose" defaultValue={displayValue(property?.purpose) || "SALE"}>{PROPERTY_PURPOSES.map((purpose) => <option key={purpose} value={purpose}>{purpose.replaceAll("_", " ")}</option>)}</select></label>
          <label>Price display<select name="priceMode" defaultValue={displayValue(property?.priceMode) || "PRICE_ON_REQUEST"}>{PRICE_MODES.map((mode) => <option key={mode} value={mode}>{mode.replaceAll("_", " ")}</option>)}</select></label>
          <label>Price in rupees<input name="priceMinor" inputMode="decimal" pattern="\d{1,12}(?:\.\d{1,2})?" defaultValue={minorUnitsToRupees(property?.priceMinor)} placeholder="Leave blank for price on request" /></label>
          <label>Maximum price for a range<input name="priceMaxMinor" inputMode="decimal" pattern="\d{1,12}(?:\.\d{1,2})?" defaultValue={minorUnitsToRupees(property?.priceMaxMinor)} placeholder="Required only for price ranges" /></label>
          <label>Locality<input name="locality" minLength={2} maxLength={120} defaultValue={displayValue(property?.locality)} required placeholder="Old Manali, Naggar…" /></label>
          <label>Area<input name="areaValue" type="number" min="0" step="0.01" defaultValue={displayValue(property?.areaValue)} /></label>
          <label>Area unit<input name="areaUnit" maxLength={30} defaultValue={displayValue(property?.areaUnit)} placeholder="sq ft, bigha, kanal…" /></label>
          <label>Address <span>(optional)</span><input name="address" maxLength={300} defaultValue={displayValue(property?.address)} /></label>
          <label className="editor-wide">Amenities <span>(comma separated)</span><input name="amenities" maxLength={2000} defaultValue={Array.isArray(property?.amenities) ? property.amenities.join(", ") : ""} placeholder="River view, parking, orchard…" /></label>
          <label className="editor-wide">Description<textarea name="description" minLength={20} maxLength={12000} rows={6} defaultValue={displayValue(property?.description)} required /></label>
        </div>
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="editor-actions"><button className="button" disabled={saving}>{saving ? "Saving…" : isEditing ? "Save listing" : "Save as draft"}</button>{isEditing && <button type="button" className="button gold" onClick={() => void changeStatus()} disabled={saving || hasUnsavedChanges}>{status === "PUBLISHED" ? "Pause listing" : "Publish listing"}</button>}<button type="button" className="text-button" onClick={onCancel} disabled={saving}>Cancel</button></div>
      </form>
      {isEditing && <MediaManager propertyId={String(property.id)} initialMedia={Array.isArray(property.media) ? property.media as Row[] : []} />}
    </>
  );
}

function MediaManager({ propertyId, initialMedia }: { propertyId: string; initialMedia: Row[] }) {
  const [media, setMedia] = useState(initialMedia);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  async function refreshMedia() {
    const result = await fetchAdminRequest(`admin/properties/${encodeURIComponent(propertyId)}`, "GET");
    const updated = result.property as Row | undefined;
    setMedia(Array.isArray(updated?.media) ? updated.media as Row[] : []);
  }

  async function uploadPhoto() {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }
    if (altText.trim().length < 2) {
      setError("Add a short, useful description for accessibility.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const signed = await fetchAdminRequest("admin/media/signature", "POST", {});
      const cloudName = displayValue(signed.cloudName);
      const apiKey = displayValue(signed.apiKey);
      const signature = displayValue(signed.signature);
      const timestamp = displayValue(signed.timestamp);
      const folder = displayValue(signed.folder);
      if (!/^[a-z0-9-]+$/i.test(cloudName) || !apiKey || !signature || !timestamp || !folder) {
        throw new Error("Image upload is not configured correctly.");
      }

      const upload = new FormData();
      upload.append("file", file);
      upload.append("api_key", apiKey);
      upload.append("timestamp", timestamp);
      upload.append("folder", folder);
      upload.append("signature", signature);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: upload });
      const uploaded = (await response.json()) as { public_id?: string; secure_url?: string; width?: number; height?: number; error?: { message?: string } };
      if (!response.ok || !uploaded.public_id || !uploaded.secure_url) {
        throw new Error(uploaded.error?.message ?? "Cloudinary could not upload this image.");
      }

      await fetchAdminRequest(`admin/properties/${encodeURIComponent(propertyId)}/media`, "POST", {
        cloudinaryPublicId: uploaded.public_id,
        deliveryUrl: uploaded.secure_url,
        mediaType: "IMAGE",
        displayOrder: media.length,
        altText: altText.trim(),
        isCover: false,
        moderationState: "PENDING",
        width: uploaded.width,
        height: uploaded.height,
      });
      await refreshMedia();
      setFile(null);
      setAltText("");
      setFileInputKey((key) => key + 1);
      setNotice("Photo uploaded and saved for review.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The image could not be uploaded.");
    } finally {
      setBusy(false);
    }
  }

  async function updateMedia(item: Row, changes: Row, successMessage: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fetchAdminRequest(`admin/properties/${encodeURIComponent(propertyId)}/media/${encodeURIComponent(String(item.id))}`, "PATCH", changes);
      await refreshMedia();
      setNotice(successMessage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The photo could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="media-manager" aria-labelledby="media-heading">
      <div className="media-manager-heading"><div><h3 id="media-heading">Property photography</h3><p>Uploads stay private until approved. Publishing requires an approved cover image.</p></div></div>
      <div className="media-upload">
        <label>Choose image<input key={fileInputKey} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)} /></label>
        <label>Image description<input value={altText} maxLength={200} onChange={(event) => setAltText(event.currentTarget.value)} placeholder="Describe the scene for visitors" /></label>
        <button type="button" className="button" disabled={busy || !file || altText.trim().length < 2} onClick={() => void uploadPhoto()}>{busy ? "Working…" : "Upload photo"}</button>
      </div>
      {error && <p role="alert" className="error-text">{error}</p>}
      {notice && <p role="status" className="admin-notice">{notice}</p>}
      {media.length ? (
        <div className="media-grid">
          {media.map((item, index) => {
            const approved = item.moderationState === "APPROVED";
            return (
              <article className="media-card" key={String(item.id ?? index)}>
                <img src={displayValue(item.deliveryUrl)} alt={displayValue(item.altText)} width={480} height={320} />
                <div><p className="media-alt">{displayValue(item.altText)}</p><p className="media-state">{item.isCover ? "Cover image · " : ""}{displayValue(item.moderationState).replaceAll("_", " ")}</p></div>
                <div className="media-actions">
                  {!approved && <button type="button" className="text-button" disabled={busy} onClick={() => void updateMedia(item, { moderationState: "APPROVED" }, "Photo approved.")}>Approve</button>}
                  {approved && !item.isCover && <button type="button" className="text-button" disabled={busy} onClick={() => void updateMedia(item, { isCover: true }, "Cover image updated.")}>Make cover</button>}
                  {item.moderationState !== "REJECTED" && <button type="button" className="text-button" disabled={busy} onClick={() => void updateMedia(item, { moderationState: "REJECTED", isCover: false }, "Photo rejected.")}>Reject</button>}
                </div>
              </article>
            );
          })}
        </div>
      ) : <p className="admin-help">No photos attached yet.</p>}
    </section>
  );
}

async function fetchAdminRequest(path: string, method = "GET", body?: unknown) {
  const response = await fetch(`${API_BASE_URL}/${path}`, {
    method,
    credentials: "include",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = (await response.json()) as ApiResult;
  if (!response.ok) throw new Error(result.error?.message ?? "The listing could not be saved.");
  return result;
}

function rupeesToMinorUnits(amount: string) {
  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(amount)) throw new Error("Enter a valid price in rupees with up to two decimal places.");
  const [whole, fraction = ""] = amount.split(".");
  return String(Number(whole) * 100 + Number(fraction.padEnd(2, "0")));
}

function minorUnitsToRupees(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  const digits = String(value);
  if (!/^\d+$/.test(digits)) return "";
  const padded = digits.padStart(3, "0");
  const whole = padded.slice(0, -2).replace(/^0+(?=\d)/, "");
  return `${whole}.${padded.slice(-2)}`;
}

function displayValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function Records({ rows }: { rows: unknown }) {
  if (!Array.isArray(rows) || !rows.length) {
    return <div className="empty-state"><h2>Nothing here yet.</h2><p>New records will appear here as the website is used.</p></div>;
  }
  const keys = Object.keys(rows[0] as Row).filter((key) => ["title", "requesterName", "status", "action", "entityType", "createdAt", "dueAt", "email", "phone"].includes(key));
  return (
    <div className="table-scroll"><table><thead><tr>{keys.map((key) => <th key={key}>{key.replace(/([A-Z])/g, " $1")}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => { const record = row as Row; return <tr key={String(record.id ?? index)}>{keys.map((key) => <td key={key}>{String(record[key] ?? "—")}</td>)}</tr>; })}</tbody>
    </table></div>
  );
}
