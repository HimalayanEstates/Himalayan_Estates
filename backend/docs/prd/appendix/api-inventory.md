# API Inventory

These are the implemented MVP contracts under `/api/v1`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/properties` | Public | Paginated search with filters, sort, and location |
| GET | `/api/v1/properties/:slug` | Public | Return one published listing |
| POST | `/api/v1/inquiries` | Public | Validate and create a property or general inquiry |
| GET | `/api/v1/categories` | Public | Return active categories and location metadata |
| POST | `/api/v1/auth/sign-in` | Public | Create secure administrator session |
| POST | `/api/v1/auth/sign-out` | Session | Revoke administrator session cookie |
| POST | `/api/v1/auth/refresh` | Session | Rotate an active administrator session |
| GET/POST | `/api/v1/admin/properties` | Staff key | List or create draft listings |
| GET/PATCH/DELETE | `/api/v1/admin/properties/:id` | Staff key | Inspect, update, or archive a listing |
| POST | `/api/v1/admin/properties/:id/:action` | Staff key | Submit review, publish, pause, or archive |
| POST | `/api/v1/admin/properties/:id/media` | Staff key | Attach Cloudinary media metadata |
| PATCH/DELETE | `/api/v1/admin/properties/:id/media/:mediaId` | Staff key | Moderate, reorder, or remove media |
| GET | `/api/v1/admin/inquiries` | Staff key | List and filter leads |
| GET/PATCH | `/api/v1/admin/inquiries/:id` | Staff key | Inspect and update a lead |
| GET | `/api/v1/admin/audit-events` | Staff key | Filterable audit log |
| GET/POST | `/api/v1/admin/cms/pages` | Staff key | List or create editable pages |
| GET/PATCH/POST | `/api/v1/admin/cms/pages/:slug` | Staff key | Edit, publish, or unpublish a page |
| GET/PUT | `/api/v1/admin/cms/content` | Staff key | Manage editable content keys |
| GET/PUT | `/api/v1/admin/cms/settings` | Staff key | Manage global site settings |
| GET | `/api/v1/site/pages/:slug` | Public | Read a published page |
| GET | `/api/v1/site/content/:key` | Public | Read published content |
| GET | `/api/v1/admin/crm/dashboard` | Staff key | CRM metrics and recent leads |
| GET/POST | `/api/v1/admin/crm/tasks` | Staff key | Manage follow-up tasks |
| GET/POST | `/api/v1/admin/inquiries/:id/activities` | Staff key | Manage CRM activity timeline |

All list endpoints should return `items`, `page`, `pageSize`, `total`, and applied filters. Errors use a stable code, human-readable message, and field-level details where relevant. Public create endpoints require spam protection and idempotency handling to prevent duplicate submissions.

