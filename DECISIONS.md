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
