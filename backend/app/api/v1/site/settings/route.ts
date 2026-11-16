import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api';
import { db } from '@/lib/db';
import { PUBLIC_SETTING_KEYS } from '@/lib/public-settings';
import { serializeForJson } from '@/lib/serialize';
import { unstable_cache } from 'next/cache';

const publicSettings = unstable_cache(async () => serializeForJson(await db.siteSetting.findMany({ where: { settingKey: { in: [...PUBLIC_SETTING_KEYS] } }, orderBy: { settingKey: 'asc' } })), ['public-settings'], { revalidate: 30, tags: ['public-settings'] });

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const settings = await publicSettings();
  return apiSuccess({ settings: serializeForJson(settings) }, { headers: { 'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=120' } });
}
