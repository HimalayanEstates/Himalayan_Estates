"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { API_BASE_URL } from "./api";
import { sitePageDefaults, siteSettingDefaults, type SitePageSlug } from "./site-page-defaults";
import { imageSlots, validImageUrl, type SiteImages } from "./site-images";

type PageSections = Record<string, unknown>;
type SiteSettings = Record<string, string>;
type PropertyCategory = { value: string; label: string; description: string };
type SiteData = {
  pages: Partial<Record<SitePageSlug, PageSections>>;
  settings: SiteSettings;
  categories: PropertyCategory[];
  loadPage: (slug: SitePageSlug) => Promise<void>;
  loadSettings: () => Promise<void>;
  loadCategories: () => Promise<void>;
};

const categoryDetails: Record<string, Omit<PropertyCategory, "value">> = {
  HOTEL: { label: "Hotels & resorts", description: "Hospitality with a mountain perspective." },
  LAND: { label: "Land & orchards", description: "Space to put down roots." },
  HOUSE_VILLA: { label: "Homes & villas", description: "A slower pace. A place of your own." },
  APARTMENT: { label: "Apartments", description: "A considered base in the mountains." },
  COMMERCIAL: { label: "Commercial spaces", description: "Room for your next venture." },
  RESORT: { label: "Resorts", description: "A destination with room to grow." },
  FARM: { label: "Farms", description: "Land shaped by the seasons." },
  OTHER: { label: "Other properties", description: "Explore a distinctive opportunity." },
};

const initialCategories = Object.keys(categoryDetails).map((value) => ({ value, ...categoryDetails[value] }));
const SiteDataContext = createContext<SiteData>({
  pages: {},
  settings: {},
  categories: initialCategories,
  loadPage: async () => {},
  loadSettings: async () => {},
  loadCategories: async () => {},
});

export function SiteDataProvider({ children, initialPages = {} }: { children: ReactNode; initialPages?: Partial<Record<SitePageSlug, PageSections>> }) {
  const [data, setData] = useState<Omit<SiteData, "loadPage" | "loadSettings" | "loadCategories">>({ pages: initialPages, settings: {}, categories: initialCategories });
  const pageRequests = useRef(new Map<SitePageSlug, Promise<void>>((Object.keys(initialPages) as SitePageSlug[]).map(slug => [slug, Promise.resolve()])));
  const settingsRequest = useRef<Promise<void> | null>(null);
  const categoriesRequest = useRef<Promise<void> | null>(null);

  const loadPage = useCallback((slug: SitePageSlug) => {
    const existing = pageRequests.current.get(slug);
    if (existing) return existing;
    const request = fetch(`${API_BASE_URL}/site/pages/${slug}`, { cache: "no-store", headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        const sections = payload?.page?.sections;
        if (isRecord(sections)) setData((current) => ({ ...current, pages: { ...current.pages, [slug]: sections } }));
      })
      .catch(() => {});
    pageRequests.current.set(slug, request);
    return request;
  }, []);

  const loadSettings = useCallback(() => {
    if (settingsRequest.current) return settingsRequest.current;
    settingsRequest.current = fetch(`${API_BASE_URL}/site/settings`, { cache: "no-store", headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        const settings: SiteSettings = {};
        if (Array.isArray(payload?.settings)) {
          for (const item of payload.settings) {
            if (typeof item?.settingKey !== "string") continue;
            const value = item.value;
            settings[item.settingKey] = typeof value === "string" ? value : value == null ? "" : String(value);
          }
        }
        setData((current) => ({ ...current, settings }));
      })
      .catch(() => {});
    return settingsRequest.current;
  }, []);

  const loadCategories = useCallback(() => {
    if (categoriesRequest.current) return categoriesRequest.current;
    categoriesRequest.current = fetch(`${API_BASE_URL}/categories`, { cache: "no-store", headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!Array.isArray(payload?.categories)) return;
        const categories = payload.categories
          .filter((value: unknown): value is string => typeof value === "string" && value in categoryDetails)
          .map((value: string) => ({ value, ...categoryDetails[value] }));
        setData((current) => ({ ...current, categories }));
      })
      .catch(() => {});
    return categoriesRequest.current;
  }, []);

  useEffect(() => {
    const refresh = () => {
      const activePages = Array.from(pageRequests.current.keys());
      const reloadSettings = settingsRequest.current !== null;
      const reloadCategories = categoriesRequest.current !== null;
      pageRequests.current.clear();
      for (const slug of activePages) void loadPage(slug);
      if (reloadSettings) {
        settingsRequest.current = null;
        void loadSettings();
      }
      if (reloadCategories) {
        categoriesRequest.current = null;
        void loadCategories();
      }
    };
    window.addEventListener("site-data-updated", refresh);
    return () => window.removeEventListener("site-data-updated", refresh);
  }, [loadCategories, loadPage, loadSettings]);

  const contextValue = useMemo(() => ({ ...data, loadPage, loadSettings, loadCategories }), [data, loadPage, loadSettings, loadCategories]);
  return <SiteDataContext.Provider value={contextValue}>{children}</SiteDataContext.Provider>;
}

export function useSitePage<T extends object>(slug: SitePageSlug, enabled = true): T {
  const { pages, loadPage } = useContext(SiteDataContext);
  useEffect(() => { if (enabled) void loadPage(slug); }, [enabled, loadPage, slug]);
  return useMemo(() => mergeContent(sitePageDefaults[slug], pages[slug]) as T, [slug, pages]);
}

export function useSiteSetting(key: keyof typeof siteSettingDefaults) {
  const { settings, loadSettings } = useContext(SiteDataContext);
  useEffect(() => { void loadSettings(); }, [loadSettings]);
  return settings[key] ?? siteSettingDefaults[key];
}

export function usePropertyCategories() {
  const { categories, loadCategories } = useContext(SiteDataContext);
  useEffect(() => { void loadCategories(); }, [loadCategories]);
  return categories;
}

export function useSiteImages() {
  const images = useSitePage<SiteImages>("images");
  return useCallback((key: string, fallback?: string) => {
    const slot = imageSlots.find(item => item.key === key);
    const image = images[key];
    const url = image?.url && validImageUrl(image.url) ? image.url : fallback || slot?.fallback || "";
    return { src: image?.active === false ? "" : url, alt: image?.alt || slot?.alt || "" };
  }, [images]);
}

function mergeContent(defaultValue: unknown, remoteValue: unknown): unknown {
  if (remoteValue === undefined || remoteValue === null) return defaultValue;
  if (Array.isArray(defaultValue)) return Array.isArray(remoteValue) ? remoteValue : defaultValue;
  if (isRecord(defaultValue) && isRecord(remoteValue)) {
    const merged: Record<string, unknown> = { ...defaultValue };
    for (const [key, value] of Object.entries(remoteValue)) {
      merged[key] = key in defaultValue ? mergeContent(defaultValue[key], value) : value;
    }
    return merged;
  }
  return remoteValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
