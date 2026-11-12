# Himalayan Estates — Backend PRD

**Status:** Greenfield backend specification  
**Scope:** API, persistence, authorization, workflows, and integrations only

## 1. Backend Objective

Provide a secure, searchable system for a broker to manage heterogeneous property inventory in Manali and convert public inquiries into an auditable sales pipeline. The initial catalog is intentionally single-location; locality is used for Manali-area neighborhoods, not city expansion. This is an inferred design based on publicly observable marketplace capabilities from MagicBricks and 99acres; it is not a reconstruction of their private services or APIs.

## 2. Core Resources

### User and staff

`User`: id, name, email, phone, role, last login, created/updated timestamps. The system has one staff role: `administrator`, with access to listings, media, inquiries, publishing, and audit records.

### Property

`Property`: id, slug, title, category, purpose, status, description, price mode/value/range, currency, area/value/unit, address, locality, city, latitude/longitude visibility, amenities, category-specific attributes, assigned agent, verification status/date/source, SEO fields, published/updated timestamps, and audit metadata.

Categories include hotel, land, house/villa, apartment, commercial, resort, farm, and other. Category-specific JSON or typed extension tables must support hotel rooms/occupancy, land zoning/frontage/title-document availability, residential bedrooms/bathrooms, and commercial permitted use without weakening common-field validation.

### Media and documents

`PropertyMedia`: property id, Cloudinary public ID, delivery URL, type, order, caption, alt text, cover flag, checksum, moderation state, width, and height. `PropertyDocument`: property id, document type, private storage reference, visibility, verification state, and uploaded-by. Public responses must never expose private storage references or private documents. Images should be transformed through Cloudinary delivery URLs rather than resized in the application server.

### Inquiry

`Inquiry`: id, property id or general source, requester name, email/phone, preferred contact method, message, visit preference, consent timestamp, UTM/source metadata, status, assignee, next follow-up, internal notes, created/updated timestamps. Preserve a listing snapshot at inquiry creation so later edits do not rewrite lead context.

## 3. State Workflows

### Listing

`draft → in_review → published → paused → archived`.

Only administrators can publish. Publishing requires title, category, purpose, locality, description, pricing mode, a cover image, and valid category-specific fields. Paused and archived listings are excluded from public search; archiving is soft-delete only.

### Inquiry

`new → contacted → qualified → visit_scheduled → won|lost`; any state may become `spam` with an audit reason. Invalid transitions return a stable business error and do not silently mutate data.

## 4. API Contract

### Public

- `GET /api/v1/properties` — cursor/page search; filters: purpose, category, locality, price, area/unit, bedrooms/rooms, amenities, verified, and availability; sort by relevance, newest, price, or area.
- `GET /api/v1/properties/{slug}` — published property, public media, safe location, broker contact configuration, and related listings.
- `GET /api/v1/categories` — active category and filter metadata.
- `POST /api/v1/inquiries` — create inquiry with idempotency key, consent, spam controls, and listing snapshot.

### Staff

- `POST /api/v1/auth/sign-in`, `POST /api/v1/auth/sign-out`, `POST /api/v1/auth/refresh`.
- `GET/POST /api/v1/admin/properties`, `GET/PATCH /api/v1/admin/properties/{id}`.
- `POST /api/v1/admin/properties/{id}/submit-review`, `/publish`, `/pause`, `/archive`.
- `POST/DELETE/PATCH /api/v1/admin/properties/{id}/media`.
- `GET/PATCH /api/v1/admin/inquiries/{id}` and `GET /api/v1/admin/inquiries`.
- `GET /api/v1/admin/audit-events` — administrator-only, filterable by actor/resource/action.

All list responses return `items`, pagination metadata, applied filters, and stable sort order. Errors return `code`, `message`, and optional field errors. Use API versioning from the first release.

## 5. Search and Data Rules

- Index only `published` properties; filter category-specific fields only when relevant.
- Normalize locality/city aliases and store canonical IDs for reliable search.
- Store monetary values as integer minor units plus currency; store area value and unit explicitly.
- Use database full-text search for title, locality, description, and listing ID; add geospatial/range indexes when volume requires them.
- Never claim “verified” unless an administrator has recorded evidence and timestamp.
- Deduplicate inquiry submissions using an idempotency key and short-window requester/property checks.

## 6. Security and Operations

Use secure, HTTP-only staff sessions or short-lived access tokens with rotation; enforce role checks server-side, rate-limit authentication and public inquiries, validate uploads by MIME and content signature, scan files, and keep private documents outside public storage. Encrypt sensitive data in transit and at rest, redact contact data from logs, retain audit events, and support account/data deletion requests. Queue email/WhatsApp notifications with retries and dead-letter visibility; do not block inquiry creation on notification delivery.

## 7. Acceptance Tests

- Unauthorized users cannot access staff resources or publish a listing.
- A draft can be incomplete, but publication returns every missing field and creates no partial public record.
- Search never returns paused, archived, draft, or unapproved properties.
- Property edits do not change an existing inquiry snapshot.
- Duplicate inquiry retries produce one lead and one notification event.
- Every state transition records actor, old state, new state, timestamp, and reason where required.

## 8. Backend Decisions Needed

Confirmed infrastructure: use Neon PostgreSQL as the hosted database and Cloudinary as the image asset pipeline. Manali is the confirmed launch location. Remaining decisions are search-only database queries versus a dedicated search index, session versus token authentication, email/WhatsApp provider, map/geocoding provider, retention periods, document storage for private files, and the exact verification evidence required for hotels and land.

Required environment configuration should include `DATABASE_URL`, `DIRECT_DATABASE_URL` when migrations need a direct Neon connection, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Keep these values server-only and provide only variable names in `.env.example`.

