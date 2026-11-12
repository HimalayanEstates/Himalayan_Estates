# Himalayan Estates — Property Brokerage Web App PRD

**Status:** Draft MVP specification  
**Audience:** Product, design, engineering, brokerage operations  
**Primary outcome:** Help prospective buyers or tenants discover credible properties and convert interest into qualified broker leads.

## 1. Product Overview

Himalayan Estates is a broker-managed property marketplace for publishing and discovering hotels, land parcels, homes, apartments, commercial spaces, resorts, and other investment properties. Visitors can search by location, category, budget, size, and intended use; compare listing details; and contact the brokerage without exposing private owner information. Staff manage listings, media, inquiries, and verification from a protected dashboard.

**Confirmed launch decisions:** the first and only launch location is Manali; the broker owns the listing relationship; transactions are completed offline; prices may be fixed, negotiable, or hidden; and initial lead capture is inquiry-based rather than online booking or payment.

## 1.1 Competitive Reference Findings

MagicBricks and 99acres are reference points for interaction patterns, not sources to copy. MagicBricks leads with transaction intent, location/project, property type, and budget, then adds deeper filters; its public category flows include commercial land, agricultural land, offices, warehouses, plots, and multiple area units. 99acres similarly supports buy/rent/commercial discovery, advanced filters, saved properties/searches, locality context, and direct contact actions. Himalayan Estates should adopt the underlying pattern while differentiating through a smaller broker-curated inventory, clearer verification evidence, category-specific facts for hotels and land, and human-assisted inquiries.

**Design implications:** use a simple first-step search (`purpose + location + category + budget`), reveal advanced filters contextually, preserve filters in shareable URLs, add save/search-alert capability after MVP validation, and treat locality insights as a later module rather than a launch dependency.

## 2. Goals and Success Measures

### Goals

- Publish complete, trustworthy, mobile-friendly property listings.
- Let visitors reach a relevant property within three interactions.
- Capture and route inquiries with enough context for prompt follow-up.
- Give brokers a simple workflow for draft, review, publish, pause, and archive.

### MVP success measures

- 80% of new listings pass the required-field and media checklist before publication.
- 25% of listing detail visitors submit an inquiry or contact action within 90 days.
- 90% of inquiries receive an internal assignment and first response within one business day.
- Search results return in under 2 seconds at the 95th percentile for the initial market.

## 3. Users and Permissions

| Role | Needs | Permissions |
|---|---|---|
| Visitor | Discover and evaluate properties | Browse, search, save locally or with an account, submit inquiries |
| Registered buyer/tenant | Track relevant properties and inquiries | Visitor actions plus saved listings and inquiry history |
| Broker/agent | Manage assigned inventory and leads | Create/edit listings, upload media, update inquiry status |
| Administrator | Govern catalog and operations | Manage all listings/users, approve publication, assign leads, view audit activity |

## 4. MVP Scope

### In scope

- Responsive public home, search results, listing detail, broker/contact pages.
- Categories: hotel, land, house/villa, apartment, commercial, resort, farm, and other.
- Search, filters, sorting, map/location preview, gallery, amenities, documents, and inquiry form.
- Staff authentication, listing CRUD, draft/review/published status, media management, and inquiry pipeline.
- Email or dashboard notifications for new inquiries and status changes.
- SEO-friendly listing URLs and basic analytics events.

### Out of scope for MVP

Online payments, booking calendars, automated valuation, legal title verification, mortgage workflows, public owner-to-buyer messaging, multilingual content, and native mobile apps.

## 5. Core User Journeys

1. Visitor lands on the home page → selects a category or searches a location → applies filters → opens a listing → submits an inquiry with preferred contact method.
2. Broker signs in → creates a draft → enters property facts → uploads photos/documents → submits for review → administrator publishes or requests changes.
3. Agent receives an inquiry → reviews the property and requester context → contacts the requester → records status and follow-up notes.

## 6. Functional Requirements

### Listing catalog

- Every listing must have a unique slug, category, title, location, description, pricing mode, status, owner/broker attribution, and at least one cover image before publication.
- Category-specific fields must appear conditionally: e.g., hotel rooms and occupancy, land area and zoning, or house bedrooms and bathrooms.
- Support image upload, ordering, captions, alt text, and deletion; reject unsupported file types and oversized files.
- Show a clear “Verified by Himalayan Estates” indicator only after an administrator records the verification date and source.
- Preserve unpublished drafts and prevent archived listings from appearing in public search.

### Discovery

- Search by keyword, locality, landmark, or listing ID.
- Filter by category, purpose (sale/lease), price range, area with explicit unit, bedrooms/rooms, amenities, verification, assigned broker, and availability.
- Sort by relevance, newest, price, and area; show active filter chips and a reset action.
- Provide empty, loading, error, and no-location-result states.

### Inquiry and lead management

- Listing pages must provide “Request details,” “Schedule a visit,” and “Call/WhatsApp” actions where configured.
- Inquiry fields: name, email or phone, preferred contact method, message, visit date/time preference, consent, listing ID, and UTM/source metadata.
- Validate required fields, email/phone format, consent, spam protection, and rate limits. Never expose internal notes publicly.
- Staff can assign an inquiry, set status (`new`, `contacted`, `qualified`, `visit_scheduled`, `won`, `lost`, `spam`), add notes, and record next follow-up date.

## 7. Page and Route Inventory

| Page | Route | Purpose |
|---|---|---|
| Home | `/` | Search entry, featured categories, verified/featured listings, broker CTA |
| Search results | `/properties` | Filterable and sortable catalog |
| Listing detail | `/properties/:slug` | Full property facts, media, location, and inquiry actions |
| Category landing | `/category/:category` | SEO and discovery page for a property type |
| About/contact | `/contact` | Brokerage trust information and general inquiry |
| Sign in | `/admin/sign-in` | Staff authentication |
| Listing manager | `/admin/properties` | Staff list, filters, status changes, assignment |
| Listing editor | `/admin/properties/new`, `/admin/properties/:id/edit` | Create or edit listing and media |
| Inquiry manager | `/admin/inquiries` | Assign, qualify, and track leads |
| Users/settings | `/admin/settings` | Roles, profile, notification and site settings |

Detailed page behaviors are in [pages.md](./pages.md); the backend-only specification is in [backend-prd.md](./backend-prd.md); navigation relationships are in [appendix/page-relationships.md](./appendix/page-relationships.md).

## 8. Non-Functional Requirements

- Responsive from 320px wide upward; keyboard navigable; meet WCAG 2.2 AA for core flows.
- Protect staff routes with secure sessions, role checks, CSRF protection, rate limiting, and audit logging.
- Store secrets only in environment configuration; redact personal data from logs; provide deletion/export handling for user data.
- Optimize images, use lazy loading, structured metadata, canonical URLs, and descriptive alt text.
- Back up listing and inquiry data; report upload failures without losing the draft.

## 9. Acceptance Criteria

- A visitor can find a published hotel or land listing using category, location, and price filters, open its detail page, and submit a valid inquiry.
- A broker can save an incomplete draft, return later, upload/reorder media, and submit it for review.
- An administrator can publish, pause, archive, assign, and audit a listing without direct database access.
- A submitted inquiry appears once in the staff queue, retains its listing context, and triggers the configured notification.
- Unpublished, archived, or invalid listings are not indexable or visible in public results.

## 10. Delivery Plan

**Phase 1 — Foundation:** design system, authentication, database schema, listing CRUD, image storage, deployment, and seed data.  
**Phase 2 — Public marketplace:** home, search/filtering, detail pages, SEO, inquiry form, and notification delivery.  
**Phase 3 — Operations:** review workflow, assignment, inquiry statuses, analytics, audit log, and performance/accessibility hardening.  
**Later:** maps with boundaries, saved searches, WhatsApp integration, multilingual content, CRM sync, and online booking/payment where legally appropriate.

## 11. Open Decisions

- Initial launch geography, currency, units, and supported languages.
- Exact verification evidence and who may approve it.
- Whether phone/WhatsApp actions require consent logging and an external provider.
- Map provider and address precision for sensitive land listings.
- Image/document storage limits, retention, and privacy policy wording.

