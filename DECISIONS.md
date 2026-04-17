# Decisions log

Tracks any deviations from the original spec and why.

## Phase 1

### Configurable buffer time per trailer
Spec mentioned "buffer time between rentals" globally. User chose **per-trailer
configuration**, so `Trailer.bufferHours` (default 4) lives on the trailer row.
Camp trailers seed at 24h (tank cleaning); flatbeds at 2h.

### Configurable business hours
Spec hinted at fixed pickup/return hours. User chose an admin-configurable
`Settings.businessHoursJson` keyed by weekday with `null` meaning closed. Seed
is Mon–Sat 8–6, Sun closed. The UI reads from this row in Phase 3.

### Tax stored in basis points, not percent
`Settings.taxRateBps` is an integer (basis points, 1000 = 10.00%). Avoids
floating-point rounding in price math. Seed value is 1000 per user direction.

### Money stored as integer cents
All monetary columns are `integer` cents (`dailyRateCents`, `taxCents`, etc.)
instead of `numeric`. Avoids pg numeric casting complexity and keeps Stripe
integration simple (Stripe amounts are also cents).

### JWT session strategy with Drizzle adapter
Auth.js v5 + Drizzle adapter + Credentials provider require JWT session strategy
(Credentials flows can't write to the DB session table). The adapter is still
attached so OAuth accounts persist to the `account` / `user` tables.

### Half-open booking ranges `[start, end)`
Simpler arithmetic for buffer windows and aligns with how Postgres `tstzrange`
behaves. A 1-day rental is `start today, end tomorrow`.

### Postgres exclusion constraint deferred to Phase 2
Planned `btree_gist` exclusion constraint on `(trailerId, tstzrange)` is not
in the initial migration because the booking flow doesn't exist yet to be
protected. Adding it now would block the seed. Will add in Phase 2 alongside
the booking transaction.

### Placeholder trailer images
Seed uses Unsplash URLs so the UI isn't empty on first run. These should be
replaced with real lot photos before launch. `next.config.ts` whitelists both
Unsplash and `*.public.blob.vercel-storage.com`.

### No email verification flow yet
Users can sign up and log in with just email + password. Email verification
(via Resend magic links) is Phase 2 when Resend is wired up.

### Theme
Rugged outdoor palette per user choice: deep pine green primary
(`155 35% 22%`), warm sand secondary, clay orange accent. Display font is
Bitter (warm serif), body is Inter.

## Phase 2

### Staying on Auth.js (not Clerk)
User asked whether to swap to Clerk. Decision: stay. Users are tightly coupled
to bookings via FK, we'd need a webhook syncer to mirror Clerk users into
Postgres with eventual-consistency handling, and the business won't hit
Clerk's free tier. MFA/email verification can be added in Phase 4 via Resend
magic links without vendor lock-in.

### No-overlap enforced at DB level via exclusion constraint
The `neon-http` driver does not support transactions, and `SELECT FOR UPDATE`
requires `neon-serverless` (WebSocket). Instead of adding a second driver, we
enforce no-overlap with a Postgres **btree_gist exclusion constraint** on
`(trailer_id, daterange(start_date, end_date, '[)'))` scoped to active
statuses. An overlapping insert is rejected by the DB with a catchable error.
Belt-and-suspenders: the API also checks availability before insert, and the
finalize route re-checks before creating Stripe PIs. The migration applies
the constraint via raw SQL since Drizzle Kit doesn't model exclusion
constraints.

### Two Payment Intents, reusing payment method
Front end confirms the rental PI (auto capture) via Stripe Elements, then
reuses the returned payment method to confirm the deposit PI (manual capture
= authorization hold). Renter enters their card once. If the deposit
confirmation fails, the UI surfaces it so support can release the hold
manually.

### Signature stored as PNG in Blob + embedded in PDF
Canvas signature produces a base64 PNG data URL. Finalize route writes the
PNG to Blob, generates the rental agreement PDF with `pdf-lib`, embeds the
PNG on the signature line, and stores the PDF URL on the booking. Email
confirmation links to the PDF rather than attaching it (keeps URL usable
from dashboard and avoids Resend size caps).

### Booking stays `pending` until webhook confirms payment
Creating a draft booking reserves the dates (the exclusion constraint makes
that real), but status stays `pending` until Stripe confirms payment via
webhook → moves to `confirmed`. A user who abandons checkout holds the dates
until their row ages out — Phase 3 will add a cleanup job for pending
bookings older than 30 minutes with no Payment Intent.

### Cancellation refund is best-effort against Stripe
If `STRIPE_SECRET_KEY` is set and the PI exists, we refund and cancel the
deposit PI. If Stripe calls fail we log and still mark the booking cancelled
— a partial failure shouldn't leave the DB in a stuck state. Audit log
captures the attempt; admin can reconcile in the Stripe dashboard.

### Age check at finalize, not registration
We enforce 21+ in the finalize endpoint (and the info step UI) rather than
blocking signup. Keeps under-21 users available for future bookings and
avoids an unfriendly wall at the front door.

### Email send is best-effort
`sendEmail` logs-and-returns if `RESEND_API_KEY` is unset, and webhook
handlers catch send failures without failing the webhook. Booking is
confirmed regardless; the user can always see it in their dashboard.

### Stripe API version
Pinned to `2025-02-24.acacia` (matches installed `stripe@17.5` types).
Bump deliberately when upgrading the SDK.

## Phase 3

### FullCalendar over a custom build
Spec called out FullCalendar. Used it as-is with `dayGrid` + `interaction`
plugins. Events fetched via `/api/admin/calendar?start=&end=` on each
`datesSet` so the admin can navigate months without preloading the whole
history. Trailer colors are deterministic from creation order (stable HSL hue
offsets) so the legend and events stay in sync even after renames.

### Booking status state machine
Admin actions strictly gate transitions:
- `approve`: pending → confirmed
- `mark_picked_up`: confirmed → active
- `mark_returned`: active → completed (also set by the return inspection)
- `capture_deposit`: allowed from active or completed; captures against the
  deposit PI via `stripe.paymentIntents.capture` with a partial
  `amount_to_capture`
- `release_deposit`: allowed from active/completed/cancelled; cancels the
  deposit PI (releases the hold)

Recording a pickup/return inspection also transitions status (pickup →
active, return → completed). That couples inspection with status change so
admins don't forget.

### Soft delete trailers
`DELETE /api/admin/trailers/:id` sets status to `retired` instead of deleting
the row. Keeps FK integrity for historical bookings and reports. Retired
trailers are filtered out of the public fleet but remain in admin for
auditing.

### Cron cleanup is opt-in, not automatic
`/api/cron/cleanup-pending-bookings` requires `CRON_SECRET`. If the env var
isn't set, the endpoint 401s — it won't accidentally fire in dev. Vercel Cron
sends `Authorization: Bearer <secret>`; manual invocations use
`x-cron-secret`. 30-minute TTL with a 15-minute cron cadence means a stale
pending booking lives 30-45 minutes before dates are freed.

### Inspections stored separately from bookings
Could have collapsed pickup/return fields onto the booking row. Keeping the
separate `inspection` table lets a single booking have both pickup and return
inspections with their own photo arrays, mileage, fuel, notes, and customer
signatures. Also sets up Phase 4's damage comparison workflow cleanly.

### Money inputs in the trailer form are dollars, not cents
Admins type `145.00`, not `14500`. Form converts to/from cents on
submit/load. Keeps validator honest (`dailyRateCents` is integer cents)
without making the admin UI confusing.
