# Pell City Trailer Rentals

Rental booking website for a camp + flatbed trailer rental business in Pell City,
Alabama. Customers browse the fleet, check live availability, sign a rental
agreement, and pay a deposit + rental fee. Admin manages inventory, bookings,
and maintenance on a master calendar.

## Tech stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui** (rugged-outdoor theme: pine green + clay accent)
- **Postgres** via **Neon** with **Drizzle ORM**
- **Auth.js v5** (email/password + Google OAuth)
- **Stripe** (Phase 2) — manual-capture Payment Intent for deposits
- **Vercel Blob** (Phase 2) — ID + inspection photos
- **Resend** + **React Email** (Phase 2) — transactional mail
- **Vitest** for unit tests

## Phase status

- [x] **Phase 1 — Foundation:** scaffold, schema, auth, public pages, responsive shell
- [x] **Phase 2 — Booking flow:** availability, 5-step wizard (dates, info, DL upload, e-sign, Stripe pay), rental-fee + deposit-hold Payment Intents, webhook, PDF agreement, confirmation email, customer dashboard with cancel + refund calc
- [x] **Phase 3 — Admin console:** shell + sidebar, dashboard with upcoming pickups/returns, FullCalendar master calendar color-coded by trailer, trailer CRUD with multi-photo upload, booking admin actions (approve/pickup/return/capture/release deposit), maintenance blocks, pickup/return inspection forms with photo + customer signature, reports (revenue, utilization %), cron cleanup of abandoned bookings
- [x] **Phase 4 — Polish:** 24h-pickup + day-of-return reminder emails (+ optional Twilio SMS), damage claim workflow with side-by-side pickup/return photos and line-item capture against deposit, dynamic pricing rules (date-windowed multipliers, optional per-trailer, day-of-week mask), SEO (sitemap.xml, robots.txt, LocalBusiness + Product JSON-LD), Vercel Analytics

## Local setup

### 1. Install

```bash
npm install
```

### 2. Create `.env.local`

Copy `.env.example` to `.env.local` and fill in:

- `DATABASE_URL` — connection string from [Neon](https://neon.tech). Use the
  **pooled** connection string.
- `AUTH_SECRET` — run `openssl rand -base64 32`.
- `AUTH_URL` — `http://localhost:3000` locally.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional. Create an OAuth client
  at console.cloud.google.com with authorized redirect URI
  `http://localhost:3000/api/auth/callback/google`.
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — used by `npm run db:seed`.

Phase 2+ keys (`STRIPE_*`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`) can be
blank for now.

### 3. Migrate and seed

```bash
npm run db:generate   # generate SQL migrations from schema
npm run db:migrate    # apply to Neon
npm run db:seed       # create admin + 4 sample trailers + settings row
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

- Sign in as admin using the seeded credentials from step 2.
- Customer signups go to `/register`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Next/ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (pricing, availability, rbac) |
| `npm run db:generate` | Generate Drizzle migration SQL from `lib/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations to `DATABASE_URL` |
| `npm run db:push` | Push schema directly (dev only — skips migration history) |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed admin user + sample trailers |

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import into Vercel.
3. Set every variable from `.env.example` in Project → Settings → Environment
   Variables. `AUTH_URL` should be your production URL.
4. First deploy will build. Before the app is usable:
   - Run `npm run db:migrate` against the production Neon database (from your
     machine with prod `DATABASE_URL`, or via a one-off Vercel Function).
   - Run `npm run db:seed` to create the admin and sample trailers.

## Stripe

```bash
# Install CLI once
brew install stripe/stripe-cli/stripe

# In one terminal, forward webhooks to your dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the printed webhook signing secret into STRIPE_WEBHOOK_SECRET.
```

Env vars:
- `STRIPE_SECRET_KEY` — `sk_test_...` from dashboard.stripe.com/test/apikeys
- `STRIPE_WEBHOOK_SECRET` — printed by `stripe listen`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — `pk_test_...`

Events the webhook handles:
- `payment_intent.succeeded` — rental fee captured → booking status → confirmed, confirmation email sent
- `payment_intent.amount_capturable_updated` — deposit hold authorized, logged
- `payment_intent.canceled` / `.payment_failed` — audit-logged

Use Stripe **test mode** until you're ready to accept real payments. Test card
`4242 4242 4242 4242` with any future date and any CVC.

## Vercel Blob

Create a Blob store in the Vercel dashboard under your project → Storage →
Create → Blob. Copy the token to `BLOB_READ_WRITE_TOKEN`. Driver's license
photos, signatures, and signed agreement PDFs are stored there.

## Resend

Sign up at resend.com, add an API key to `RESEND_API_KEY`, and verify your
sending domain if you want emails from your own address. Confirmation email
send is best-effort — a failed send won't block the booking from completing.

## Cron (Vercel)

`vercel.json` schedules two cron jobs:

- `/api/cron/cleanup-pending-bookings` — every 15 min. Cancels `pending`
  bookings older than 30 min that never reached Stripe, freeing up dates.
- `/api/cron/send-reminders` — daily at 15:00 UTC (~9am CT). Sends 24h-out
  pickup reminders and day-of return reminders. Idempotent via
  `booking.remindersSent` jsonb.

Set `CRON_SECRET` in Vercel env vars — Vercel Cron sends it as the
`Authorization: Bearer` header automatically. To trigger manually:

```bash
curl -H "x-cron-secret: $CRON_SECRET" \
  https://your-domain.vercel.app/api/cron/cleanup-pending-bookings

curl -H "x-cron-secret: $CRON_SECRET" \
  https://your-domain.vercel.app/api/cron/send-reminders
```

## SMS (optional)

Reminder emails include SMS automatically when all three Twilio env vars are
set: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`. Without
them, SMS sends are silent no-ops — email reminders still work.

## SEO & Analytics

- `app/sitemap.ts` — includes static pages and every active trailer, regenerates hourly
- `app/robots.ts` — allows `/`, disallows `/admin`, `/dashboard`, `/api`, `/book`
- JSON-LD — `AutoRental` schema in the root layout; `Product` schema on each trailer page
- Vercel Analytics — `@vercel/analytics/react` loaded in root layout; no config needed, shows in Vercel dashboard Analytics tab once deployed

## Tests

```bash
npm run test
```

Covers:

- Pricing calculation (`lib/pricing.ts`): daily/weekend/weekly tier selection,
  tax, deposit, invalid ranges.
- Availability logic (`lib/availability.ts`): overlap, buffer windows, half-open
  ranges.
- Auth guards (`lib/rbac.ts`): 401/403 behavior on API helpers.

## Data model

See `lib/db/schema.ts`. High-level:

```
User --< Booking >-- Trailer --< MaintenanceBlock
                     Booking --< Inspection (pickup/return)
Settings (singleton)      AuditLog
Account / Session / VerificationToken (Auth.js)
```

Key rules:

- Bookings use **half-open** date ranges: `[startDate, endDate)`.
- `Trailer.bufferHours` blocks same-day re-rentals (configurable per trailer).
- `Settings.taxRateBps` is the St. Clair County tax rate in basis points
  (default `1000` = 10.00%). Admin-editable in Phase 3.
- No double bookings: Phase 2 adds a transactional check + Postgres `btree_gist`
  exclusion constraint.

## Decisions

See `DECISIONS.md` for anywhere we deviated from the original spec.
