# WHSSignups

WHSSignups is a mobile-first volunteer signup MVP for Whitehouse High School events, initially focused on volleyball home games. It replaces manual signup sheets with public event pages, reusable volunteer templates, administrator workflows, spreadsheet import parsing, tokenized cancellation links, calendar exports, and Supabase-ready data security.

## Tech Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Supabase PostgreSQL, Supabase Auth, Row Level Security
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
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser-safe Supabase settings.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only service key for RPC-backed mutations.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`: transactional email settings.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`: optional spam prevention.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/20260725153000_initial_schema.sql`.
3. Run `supabase/seed/seed.sql`.
4. Create the first admin user in Supabase Auth.
5. Add their membership:

```sql
insert into organization_admins (organization_id, user_id, role)
values ('11111111-1111-4111-8111-111111111111', '<auth-user-id>', 'owner');
```

The migration enables RLS, public read access only for published events and visible slots, administrator organization scoping, and a `create_public_signup` RPC that locks the selected slot before counting and inserting to prevent overbooking.

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

Upload `.xlsx`, `.xls`, or `.csv` files. The parser:

- Allows worksheet selection.
- Normalizes common column names.
- Parses Excel serial dates and text dates.
- Parses common time formats.
- Detects likely home games from Home, Whitehouse, Whitehouse High School, and WHS.
- Preserves every row.
- Flags invalid rows, no-time warnings, and duplicate event candidates.

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
3. Connect Supabase and Resend production credentials.
4. Add `whssignups.com` in Vercel Domains.
5. Point DNS records as Vercel instructs.
6. Set `NEXT_PUBLIC_APP_URL=https://whssignups.com`.

## Known Limitations

- Admin create/edit buttons are UI-ready shells until Supabase write screens are expanded.
- Import publishing is represented by parser/API/migration foundations; the final duplicate merge/skip UI needs a follow-up pass.
- Email retry storage is designed through `email_logs` but retry UI is not implemented.
- `npm audit --omit=dev` reports advisories in Next transitive `postcss`/`sharp` packages and SheetJS `xlsx`; npm currently suggests a breaking downgrade for the Next items and has no fix for `xlsx`, so review upstream releases before production launch.
- SMS, payment, student accounts, recurring reminders, and multi-organization billing are intentionally out of scope for this MVP.
