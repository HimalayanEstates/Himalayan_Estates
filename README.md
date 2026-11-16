# Himalayan Estates

Property listing platform for Himalayan Estates, focused on properties in Manali.

## Workspaces

- `frontend/` — Next.js client application.
- `backend/` — Next.js API service with Prisma, Neon Postgres, and Cloudinary integrations.

Run development commands from the relevant workspace directory. Keep secrets in `backend/.env` and never commit them.

## Deploy

Use Node 22 for both services. Configure Render first using the root `render.yaml` blueprint (or select `backend` as its root, build `npm ci && npm run build`, start `npm start`). Set pooled `DATABASE_URL`, direct `DIRECT_DATABASE_URL`, `ADMIN_EMAIL`, a scrypt `ADMIN_PASSWORD_HASH` generated with `npm run auth:hash`, and Cloudinary credentials. Keep `SESSION_SECRET` at least 32 random characters; the blueprint generates one. Set `FRONTEND_ORIGIN` to the exact HTTPS website origin, without a trailing slash.

Import this repository into Vercel with Root Directory `frontend`, framework Next.js, install `npm ci`, build `npm run build`. Set server environment variable `BACKEND_ORIGIN` to the Render HTTPS origin, without `/api/v1`. Redeploy after changing it: API rewrites are determined at build time. Browser requests use `/api/v1` on the website origin so administrator cookies work through the proxy. Do not configure a separate browser API domain.

The existing Neon database must already have the Prisma schema. For a new empty database, review the schema then run `npm run db:push` from `backend`; deployments do not change the schema automatically. Never run seed or schema changes blindly against production.

## Checks

- Both workspaces: `npm run build` and `npm run typecheck`.
- Backend security regression: `npm run test:security`.
- With the backend running and local admin environment configured: `npx tsx scripts/check-endpoints.ts`. It checks all admin method guards, signed-session reads, and public reads without mutating application records. Set `CHECK_API_ORIGIN` to test through the frontend proxy.
- Frontend interaction checks are in `frontend/scripts/` and require both servers. These use synthetic intercepted submissions rather than writing real inquiries.

Deployment still requires checking login, uploads, form submission, and logout on the actual HTTPS domains. Render instance sleep and Neon wake-up can delay the first request. In-memory rate limits reset on restart and do not coordinate between multiple backend instances; add shared rate limiting before scaling horizontally.
