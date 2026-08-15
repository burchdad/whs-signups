# WHSSignups

WHSSignups is a mobile-first volunteer signup MVP for Whitehouse High School events, initially focused on volleyball home games. It replaces manual signup sheets with public event pages, reusable volunteer templates, administrator workflows, spreadsheet import parsing, tokenized cancellation links, calendar exports, and Railway Postgres-backed data storage.

## Tech Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Railway Postgres
- SheetJS/xlsx for Excel and CSV parsing
- Zod and React Hook Form for validation
- Resend email abstraction with console fallback in development
- Cloudflare Turnstile abstraction
- Vitest unit tests

## Local Setup

```bash
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

See `.env.example` for every variable:

- `NEXT_PUBLIC_APP_URL`: public app URL, usually `http://localhost:3000` locally and `https://whssignups.com` in production.
- `DATABASE_URL`: Railway Postgres connection string.
- `DATABASE_SSL`: defaults to SSL; set `false` only for local non-SSL Postgres.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`: required admin credentials and signing secret. Admin authentication fails closed when any value is missing.

The environment-based administrator is the bootstrap Super Admin. From **Admin → Access**, that account can create school, Booster Club, sport, band, choir, or club programs; assign sports/groups; and create individual scoped administrator accounts. Program admins and volunteer coordinators only see assigned events, photos, imports, signups, notifications, and exports. New accounts are redirected to change their temporary password after first login.

The verified 2026 football home schedule is installed automatically and represented by `db/migrations/007_football_2026_home_schedule.sql`. The athletics site currently exposes only a 2025 Cross Country schedule, so no expired Cross Country meets are published as current opportunities.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`: secure delivery credentials and the verified-domain fallback sender. Organization and program recipients, sender display name/address, contact email, and reply-to email are managed from **Admin → Settings**.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`: optional spam prevention.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: secure Booster Club Checkout and signed platform payment fulfillment. Configure the webhook endpoint as `/api/webhooks/stripe`.
- `STRIPE_CONNECT_WEBHOOK_SECRET`: signs events delivered from connected Booster Club Stripe accounts to the same webhook endpoint.

Each Booster Club is stored as a separate admin program. Public signups select a Booster Club before selecting its programs, and the program name, payment status, amount, and payment account are preserved in scoped admin views and CSV exports. Super Admins configure each club's membership fee and whether Stripe payment is required from **Admin → Access**.

Super Admins, organization admins, and assigned program admins can configure their club's connected Stripe account from **Admin → Settings**. The application accepts only a Stripe account ID (`acct_...`), verifies it through the platform Stripe API, and never stores a club's secret key. A connected account can belong to only one program. Checkout uses direct charges for configured connected accounts, while programs without an account continue using the platform sandbox during initial testing.

## Railway Postgres Setup

1. Create a Railway Postgres database.
2. Copy the public or private connection URL into Vercel as `DATABASE_URL`.
3. Run the schema:

```bash
psql "$DATABASE_URL" -f db/migrations/001_initial_railway_postgres.sql
psql "$DATABASE_URL" -f db/seed/seed.sql
```

The application uses an explicit server-side transaction that locks the selected volunteer slot, counts active signups, and inserts the signup atomically to prevent overbooking.

## Cloudflare Turnstile Setup

1. Log in to Cloudflare.
2. Open Turnstile from the Cloudflare dashboard.
3. Create a widget for `whssignups.com`.
4. Copy the Site Key into `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
5. Copy the Secret Key into `TURNSTILE_SECRET_KEY`.

Local development skips Turnstile when `TURNSTILE_SECRET_KEY` is empty.

## Routes

- `/`: branded home page with tagline and upcoming events.
- `/events`: event listing with sport, type, date, and availability filters.
- `/events/[slug]`: public event details and grouped volunteer slots.
- `/signup/[slotId]`: public volunteer signup form.
- `/signup/confirmation`: confirmation and calendar options.
- `/cancel/[token]`: tokenized cancellation.
- `/admin`: dashboard.
- `/admin/events`, `/admin/events/new`, `/admin/events/[id]`: event management shell.
- `/admin/import`: schedule import workflow shell backed by `/api/import/preview`.
- `/admin/templates`: reusable volunteer templates.
- `/admin/signups`: search/export shell.
- `/admin/settings`: organization configuration.

## Importing Schedules

Upload an `.xlsx`, `.xls`, or `.csv` file up to 5 MB. The admin-only parser:

- Allows worksheet selection.
- Normalizes common column names.
- Parses Excel serial dates and text dates.
- Parses common time formats.
- Detects likely home games from Home, Whitehouse, Whitehouse High School, and WHS.
- Preserves every row.
- Flags invalid rows, no-time warnings, and duplicate event candidates.
- Rejects workbooks with more than 10 worksheets, 5,000 rows per worksheet, or 100 columns per worksheet.

A sample file is available at `fixtures/sample-import.csv`.

## Emails

`src/lib/email/service.ts` uses Resend when `RESEND_API_KEY` is set. Without credentials, it logs safe email payloads to the server console and does not block signup success. The service is structured for signup confirmations, cancellation links, and admin notifications.

## Calendar And Exports

- `/api/calendar/[eventId]/[slotId]` returns an `.ics` file.
- Confirmation pages include a Google Calendar URL.
- `/api/exports/signups` returns CSV with the requested roster columns.

## Testing And Build

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Tests cover date parsing, time parsing, column normalization, home-game detection, duplicate detection, invalid row reporting, slug generation, slot availability, full-slot rejection, signup validation, cancellation token hashing, admin authorization expectations, and export generation.

## Vercel And Domain

1. Import the GitHub repo into Vercel.
2. Set environment variables for Production and Preview.
3. Connect Railway Postgres and Resend production credentials.
4. Add `whssignups.com` in Vercel Domains.
5. Point DNS records as Vercel instructs.
6. Set `NEXT_PUBLIC_APP_URL=https://whssignups.com`.

## Known Limitations

- Admin create/edit buttons are UI-ready shells until Railway-backed write screens are expanded.
- Import publishing is represented by parser/API/migration foundations; the final duplicate merge/skip UI needs a follow-up pass.
- Email retry storage is designed through `email_logs` but retry UI is not implemented.
- SMS, student accounts, and multi-organization billing are intentionally out of scope for this MVP.
