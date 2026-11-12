# Page Requirements

## Public pages

### Home — `/`

Hero search accepts purpose (buy, rent, or lease), keyword/location, category, and budget. Below it, show category cards, featured listings, recently added listings, trust/verification messaging, and a broker contact CTA. Search submits to `/properties` with query parameters; featured cards open `/properties/:slug`. Advanced filters should be available after the initial search rather than crowding the hero.

### Search results — `/properties`

Desktop layout uses filters beside a result grid; mobile uses a filter drawer. Filters are category, purpose, locality, price min/max, area min/max plus unit, bedrooms/rooms, amenities, furnished status where relevant, assigned broker, verified-only, and availability. Each card shows cover image, title, locality, price label, area, key facts, verification badge, and updated date. Support pagination or infinite loading, sorting, clear-all, loading, empty, and error states. Results must preserve filters in the URL and provide a shareable result link. A later release may add saved searches and locality insights.

### Listing detail — `/properties/:slug`

Show breadcrumb, gallery, title, verification/status, price, location, summary facts, description, category-specific facts, amenities, map preview, documents available on request, broker profile, similar listings, and sticky inquiry actions. Gallery supports thumbnails, full-screen view, captions, keyboard navigation, and alt text. Do not reveal exact sensitive land coordinates unless the listing permits it.

### Contact — `/contact`

Show brokerage address/regions served, phone, email, office hours, social links, and a general inquiry form. The form captures name, contact, interest, message, consent, and source.

## Staff pages

### Sign in — `/admin/sign-in`

Email/username and password, validation, loading state, failed-login message, rate limiting, and sign-out. Redirect authenticated staff to the page requested before login or to the relevant dashboard.

### Listing manager — `/admin/properties`

Table columns: cover, title, category, locality, price, status, verification, assigned broker, updated date, and actions. Filters include status, category, broker, verification, and keyword. Actions are view, edit, duplicate, submit for review, publish, pause, archive, and delete with confirmation; visibility depends on role and status.

### Listing editor — `/admin/properties/new` and `/admin/properties/:id/edit`

Sections: basics, location, pricing, category-specific facts, description, amenities, media, documents, broker assignment, verification, SEO, and preview. Required fields are title, category, purpose, locality, description, pricing mode, and cover image for publication. Save draft must allow incomplete data; publish validates all required fields and records the actor. Conditional facts change by category without deleting previously saved values.

### Inquiry manager — `/admin/inquiries`

Table columns: requester, listing, contact method, source, status, assignee, received date, next follow-up, and last activity. Detail view shows the original inquiry, consent, listing snapshot, internal notes, activity timeline, assignment, status transition, and follow-up date. Staff can filter, assign, update status, add notes, and export only if authorized.

