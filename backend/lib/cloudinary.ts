import crypto from 'node:crypto';

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary server configuration is incomplete.');
  return { cloudName, apiKey, apiSecret };
}

export function createCloudinarySignature(params: Record<string, string | number>) {
  const { apiSecret } = getCloudinaryConfig();
  const payload = Object.entries(params).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}=${value}`).join('&');
  return crypto.createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
}
