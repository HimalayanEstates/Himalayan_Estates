import { loadEnvConfig } from '@next/env';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { createSessionToken } from '../lib/session';

loadEnvConfig(process.cwd());
const base = process.env.CHECK_API_ORIGIN || 'http://localhost:4000';
function routes(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? routes(join(dir, entry.name)) : entry.name === 'route.ts' ? [join(dir, entry.name)] : []);
}
async function main() {
  let checks = 0;
  for (const file of routes('app/api/v1/admin')) {
    const path = '/' + file.replaceAll('\\', '/').replace(/^app\//, '').replace(/\/route.ts$/, '').replace(/\[[^\]]+\]/g, 'endpoint-check-missing');
    for (const match of Array.from(readFileSync(file, 'utf8').matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\(/g))) {
      const method = match[1];
      const response = await fetch(base + path, { method, ...(method === 'GET' ? {} : { body: '{}', headers: { 'Content-Type': 'application/json' } }) });
      assert.equal(response.status, 401, `${method} ${path}: anonymous access`);
      checks++;
    }
    if (readFileSync(file, 'utf8').includes('export async function GET(')) {
      const token = createSessionToken(process.env.ADMIN_EMAIL!);
      const response = await fetch(base + path, { headers: { cookie: `he_session=${token}` } });
      assert.ok([200, 404].includes(response.status), `authenticated GET ${path}: ${response.status}`);
      checks++;
    }
  }
  for (const path of ['/api/v1/categories', '/api/v1/properties', '/api/v1/site/settings', '/api/v1/site/pages/home', '/api/v1/properties/endpoint-check-missing', '/api/v1/site/content/endpoint-check-missing']) {
    const response = await fetch(base + path);
    assert.equal(response.status, path.endsWith('endpoint-check-missing') ? 404 : 200, path);
    checks++;
  }
  console.log(`PASS ${checks} endpoint checks: all admin method guards, authenticated reads, public reads. No application records mutated.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
