import crypto from 'node:crypto';

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 } as const;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS).toString('base64url');
  return `scrypt.v1.${salt}.${hash}`;
}

export function verifyPassword(password: string, encoded: string) {
  const [algorithm, version, salt, expectedEncoded] = encoded.split('.');
  if (algorithm !== 'scrypt' || version !== 'v1' || !salt || !expectedEncoded) return false;
  try {
    const expected = Buffer.from(expectedEncoded, 'base64url');
    const actual = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
