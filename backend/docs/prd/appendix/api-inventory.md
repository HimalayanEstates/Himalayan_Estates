# API Inventory

These are proposed MVP contracts; no implementation exists yet.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/properties` | Public | Paginated search with filters, sort, and location |
| GET | `/api/properties/:slug` | Public | Return one published listing and related listings |
| POST | `/api/inquiries` | Public | Validate and create a property or general inquiry |
| GET | `/api/categories` | Public | Return active categories and display metadata |
| POST | `/api/auth/sign-in` | Staff | Create secure staff session |
| GET | `/api/admin/properties` | Staff | Paginated management list |
| POST | `/api/admin/properties` | Broker+ | Create draft |
| PATCH | `/api/admin/properties/:id` | Broker+ | Update listing fields/status |
| POST | `/api/admin/properties/:id/media` | Broker+ | Upload and attach media |
| POST | `/api/admin/properties/:id/publish` | Admin | Validate and publish listing |
| GET | `/api/admin/inquiries` | Staff | List and filter leads |
| PATCH | `/api/admin/inquiries/:id` | Staff | Assign, transition, note, or schedule follow-up |

All list endpoints should return `items`, `page`, `pageSize`, `total`, and applied filters. Errors use a stable code, human-readable message, and field-level details where relevant. Public create endpoints require spam protection and idempotency handling to prevent duplicate submissions.

