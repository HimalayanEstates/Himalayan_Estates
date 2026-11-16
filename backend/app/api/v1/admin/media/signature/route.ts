import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api';
import { requireAdmin } from '@/lib/admin';
import { createCloudinarySignature, getCloudinaryConfig } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  try {
    const { cloudName, apiKey } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const body = await request.json().catch(() => ({}));
    const folder = body?.purpose === 'website' ? 'himalayan-estates/website' : 'himalayan-estates/properties';
    return apiSuccess({ cloudName, apiKey, timestamp, folder, signature: createCloudinarySignature({ folder, timestamp }) });
  } catch (error) {
    console.error('cloudinary.signature_failed', error);
    return apiError(503, 'MEDIA_PROVIDER_NOT_CONFIGURED', 'Image uploads are not configured yet.');
  }
}
