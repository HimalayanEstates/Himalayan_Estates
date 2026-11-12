import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api';
import { createCloudinarySignature, getCloudinaryConfig } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  const configuredKey = process.env.ADMIN_API_KEY;
  const providedKey = request.headers.get('x-admin-api-key');
  if (!configuredKey || !providedKey || !safeSecretEqual(providedKey, configuredKey)) return apiError(401, 'UNAUTHORIZED', 'Valid staff authentication is required.');
  try {
    const { cloudName, apiKey } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'himalayan-estates/properties';
    return apiSuccess({ cloudName, apiKey, timestamp, folder, signature: createCloudinarySignature({ folder, timestamp }) });
  } catch (error) {
    console.error('cloudinary.signature_failed', error);
    return apiError(503, 'MEDIA_PROVIDER_NOT_CONFIGURED', 'Image uploads are not configured yet.');
  }
}

function safeSecretEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
