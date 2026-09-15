# Orqenta

Invoicing for small teams: customers, products, tax rules, invoices, and an
e-invoice export. Next.js 16 App Router, Drizzle over Postgres, server actions
as the only data layer.

## Running it

You need Node 22+, pnpm and Docker.

```bash
cp .env.example .env      # fill in ADMIN_PASS and JWT_SECRET
docker compose up -d db   # postgres on localhost:5433
pnpm install
pnpm db:migrate           # apply src/db/migrations
pnpm db:seed              # settings, lookups, built-in template, admin user
pnpm dev                  # http://localhost:3001
```

Sign in with the `ADMIN_USER` / `ADMIN_PASS` from your `.env`. The seed creates
that account when the `users` table is empty, and so does the first login, so
there is no separate bootstrap step.

PDF export additionally needs a Chrome binary:

```bash
npx puppeteer browsers install chrome
```

or point `PUPPETEER_EXECUTABLE_PATH` at one you already have — which is what a
slim container should do rather than shipping a second copy of Chrome.

## Environment

The app refuses to boot if any of the first four are missing or blank
(`src/instrumentation.ts` validates before the first request, so a bad `.env`
fails the boot rather than a login an hour later).

| Variable | Default | Notes |
| --- | --- | --- |
| `DATABASE_URL` | — | required |
| `ADMIN_USER` | — | required, the bootstrap account |
| `ADMIN_PASS` | — | required, non-blank |
| `JWT_SECRET` | — | required, signs the session cookie |
| `SESSION_TTL_SECONDS` | `3600` | clamped to 300–43200 |
| `COOKIE_SECURE` | `true` | also gates the HSTS header |
| `RATE_LIMIT_ENABLED` | `true` | login attempt limiting |
| `RATE_LIMIT_MAX_ATTEMPTS` | `5` | per username + IP |
| `RATE_LIMIT_WINDOW_SECONDS` | `900` | |
| `PUPPETEER_EXECUTABLE_PATH` | — | optional, for PDF export |

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | dev server on 3001 |
| `pnpm build` / `pnpm start` | production build and server |
| `pnpm test` | vitest, no watch |
| `pnpm lint` / `pnpm format` | biome |
| `pnpm db:generate` | write a migration from the schema |
| `pnpm db:migrate` | apply migrations |
| `pnpm db:seed` | idempotent, safe to re-run on every deploy |
| `pnpm db:studio` | drizzle studio |

## Layout

```
src/app/(app)      signed-in pages; the layout requires a session
src/app/(auth)     login
src/app/public     the share-token invoice page, the one page without auth
src/app/api        HTML, PDF and XML render routes
src/db             schema, migrations, seed
src/lib            domain logic — money, numbering, templates, auth, XML
src/components     UI; ui/ is vendored shadcn and not first-party code
```

Business rules live in `src/lib`, away from both the database and React, and
that is where the tests are: money rounding, invoice numbering, status
derivation, the template renderer and the UBL builder.

## How it fits together

- **Data layer.** Server actions only — no REST, no route handlers for data.
  Each one runs `requirePermission` then zod then the database, and *returns*
  its failures as `ActionResult` rather than throwing them, because Next
  replaces a thrown error with a generic message in production.
- **Reads and writes** go through TanStack Query. Mutations invalidate at the
  resource root; the cross-resource pairings live in `src/lib/query-invalidation.ts`.
- **Money** is computed in `src/lib/money.ts` and rounded at every intermediate
  step, deliberately, so results match the system this ports cent for cent.
- **`overdue` is never stored.** It is derived on read from the due date, so an
  invoice stops being overdue the moment its date moves.
- **Rendering.** One context object feeds the owner's HTML, the PDF and the
  public page, so the three cannot disagree. Templates are rows in a table and
  are interpolated, never evaluated.

## Known gaps

- The invoice, user and template pages still read `src/lib/mock-data.ts`; their
  server actions exist but the components are not wired to them yet.
- Factur-X / ZUGFeRD and FatturaPA export are not implemented. The XML route
  answers 501 for them rather than returning UBL under another name.
- `embedXmlInPdf` / `embedXmlInHtml` are stored but not yet acted on.
