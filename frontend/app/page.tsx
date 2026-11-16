import { PropertyExplorer } from '@/components/PropertyExplorer';
import { SiteDataProvider } from '@/lib/site-data';
import { API_BASE_URL } from '@/lib/api';

async function publishedSections(slug: 'home' | 'images'): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`${API_BASE_URL}/site/pages/${slug}`, { next: { revalidate: 30 }, signal: AbortSignal.timeout(4000) });
    if (!response.ok) return {};
    const payload = await response.json();
    const sections = payload?.page?.sections;
    return sections && typeof sections === 'object' && !Array.isArray(sections) ? sections : {};
  } catch { return {}; }
}

export default async function HomePage() {
  const [home, images] = await Promise.all([publishedSections('home'), publishedSections('images')]);
  return <SiteDataProvider initialPages={{ home, images }}><PropertyExplorer /></SiteDataProvider>;
}
