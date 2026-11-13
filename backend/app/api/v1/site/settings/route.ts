import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api';
import { db } from '@/lib/db';
import { serializeForJson } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const settings = await db.siteSetting.findMany({ orderBy: { settingKey: 'asc' } });
  return apiSuccess({ settings: serializeForJson(settings) });
}
