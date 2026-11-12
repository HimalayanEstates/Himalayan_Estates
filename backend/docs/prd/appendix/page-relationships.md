# Page Relationships

## Public flow

`/` → `/properties` via search or category → `/properties/:slug` via result card → `/contact` or an inquiry action. Category pages link to filtered results. Listing detail pages link back to results and to similar listings using category, locality, and price context.

## Staff flow

`/admin/sign-in` → `/admin/properties` or `/admin/inquiries`. The listing manager opens the editor with a property ID, and the editor returns to the manager after save, review, publish, or archive. An inquiry links to a listing snapshot and can link to the assigned broker. Status changes and notes append to the inquiry activity timeline.

## Data coupling rules

- Publishing, pausing, archiving, or editing a listing refreshes public search and related-listing results.
- Editing a listing does not mutate the historical listing snapshot stored on an inquiry.
- Assigning or changing inquiry status updates the staff queue and notification state but never changes public listing status.
- Deleting media updates gallery ordering and cover-image validation before the next publish action.

