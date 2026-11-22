# LifeStash — Architecture

LifeStash is a private, online-first PWA for keeping everyday records and reminders. **Garage** is the first module; **Finances** (income, spending, invoices; see `docs/FINANCES-SPEC.md`) is the second.

## Goals

Open the app and quickly answer, per car:

- What has been done to this car?
- What is due next?
- How much have I driven?
- What have I spent?

## Stack (runs at €0/month)

| Layer | Choice |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, `vite-plugin-pwa` |
| Routing / data | TanStack Router (file-based), TanStack Query |
| Forms | TanStack Form, one Zod schema per form |
| UI | Tailwind CSS v4, shadcn/ui (+ registries when useful), lucide icons |
| i18n | i18next + react-i18next (English, Macedonian) |
| API | Hono on a single Cloudflare Worker |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Auth | Email + password (PBKDF2) and/or passkeys (SimpleWebAuthn), recovery codes, DB-backed sessions |
| Photos | Backblaze B2 (private bucket, presigned URLs via `aws4fetch`) |
| Reminders | Worker cron trigger (daily) + Web Push (`@pushforge/builder`, VAPID) |
| Hosting | Worker static assets on `*.workers.dev` |
| Tooling | pnpm, oxlint + oxfmt via Ultracite, Vitest, TypeScript strict |

### Sign-in without an auth framework

Users sign in with email + password (works on any device, e.g. Linux PCs without passkeys) and/or passkeys, with one-time recovery codes as a fallback. Passwords are hashed with PBKDF2-SHA256 (100,000 iterations, the Workers maximum) via Web Crypto; five failed attempts lock password sign-in for 15 minutes. Hashing may occasionally exceed the free plan's 10 ms CPU budget, which only affects the rare sign-in request. Changing credentials needs the current password unless the session is less than 15 minutes old. Sessions are random 256-bit tokens in an `HttpOnly; Secure; SameSite=Lax` cookie; only their SHA-256 hash is stored. Recovery codes are high-entropy and stored as SHA-256 hashes.

Sign-up is only possible while no user exists (first-run setup). Additional household members can be added later through invites.

## One project, one deploy

The Cloudflare Vite plugin runs the SPA and the Worker together in dev and builds them into one Worker that serves static assets and `/api/*`.

```
src/
├─ client/                 React SPA
│  ├─ app/                 shell, providers, i18n setup
│  ├─ routes/              TanStack file routes (thin: compose module components)
│  ├─ modules/garage/      Garage UI: components, forms (schema + mapper per form), queries
│  ├─ modules/settings/
│  ├─ components/ui/       shadcn components
│  ├─ i18n/                en/*.json, mk/*.json
│  └─ lib/                 api client, auth, push, photos, formatting
├─ worker/                 Cloudflare Worker
│  ├─ index.ts             exports { fetch: hono, scheduled: cron }
│  ├─ core/                auth, sessions, household context, B2, web push, errors
│  ├─ modules/garage/      <feature>/dto/<endpoint>.{request,response}.ts, routes, service
│  ├─ modules/settings/
│  └─ db/schema/           Drizzle tables per module
└─ shared/domain/          pure logic only (units, partial dates, money, reminder math)
```

### Rules

- **Modules** own a folder on both sides, their own `/api/<module>/*` routes and their own tables.
- **Each endpoint has its own request DTO and response DTO** (one file each). DTOs are never shared between endpoints, and DB rows never leave the API without a response mapper.
- **Each form has its own schema** (`schema.ts`) and a `mapper.ts` that converts form values to the API request and API responses to form defaults. Client and server never share a schema.
- **Type safety across the boundary** comes from Hono RPC (`hc<AppType>`): the client infers request/response types from the backend DTOs, so a DTO change breaks the mapper at compile time.
- **`shared/domain`** holds only pure, tested functions used by both sides. No schemas.
- **Every query is scoped by `householdId`**, which middleware attaches after authenticating.
- **Storage units**: distance always in km, money as integer minor units plus an ISO currency. Conversion happens only at the UI edge.

## Finances module (controller → service → repository)

Finances is the first module built on the layered layout from `docs/IMPLEMENTATION-PLAN.md` §1.2:

```
src/worker/modules/finances/
├─ finances.controller.ts      mounts the sub-controllers under /api/finances
├─ finances.module.ts          builds repositories + services for one household
├─ finances.cron.ts            daily purge of soft-deleted records
├─ categories/ transactions/ clients/ invoices/ settings/ overview/
│  projects/ recurring/ export/ business-profile/
│                              <feature>.controller.ts · .service.ts · .repository.ts · dto/
├─ attachments/                counts files per finance record (files live in `photos`)
├─ notifications/              overdue-invoice push heads-ups (used by the cron)
└─ household/                  household preferences and the household-time-zone clock
```

- `core/container.ts` is the per-request composition root: `requireAuth` stores a `Container` on `c.var.container`, and `container.finances` lazily builds the module. Garage still uses its older route/service files.
- Controllers validate the DTO, call one service method and map the result to the response DTO; they never import Drizzle. Services hold the rules, take repositories by constructor and never import Hono. Repositories are constructed with `(db, householdId)` and scope every query.
- Business errors use typed codes (`finances.category_in_use`, `finances.invoice_number_taken`, …) via `domainError(code, { field })`; the client translates them (`finances:errors.*`) and shows field errors on the matching input.
- Deletes are soft (`deleted_at`) so the Undo toast can call `POST …/:id/restore`.
- Invoices (F4): `InvoicesService` holds the write rules; `InvoiceReads` (list, detail, document), `InvoiceIssuing` (numbers, frozen snapshots) and `InvoicePayments` (mark paid / unpaid) sit beside it. Invoice PDFs are drawn in the browser with `@react-pdf/renderer` (`client/modules/finances/invoice-pdf`, Inter TTF with Cyrillic), loaded with `import()` only when previewing, issuing or downloading, and kept out of the service-worker precache. The same component draws the editor's live preview and the issued PDF, which is uploaded through the photos pipeline as a `generated` attachment.
- `GET /finances/export.csv?year=&type=transactions|invoices` returns a UTF-8 CSV (with BOM) as a download; it is linked directly rather than called through the RPC client.
- `GET /finances/overview` is one request for the overview page. Its "Car costs" line comes from Garage's spending service through `overview/garage-costs.ts` (service → service, read only), so car costs are never copied into the ledger.
- Tests: services with in-memory fakes; controllers through `app.request()` against a real SQLite database (`src/worker/test/sqlite-d1.ts`, Node's built-in `node:sqlite` behind a D1 shim with all migrations applied), including household isolation.

On the client, Finances lives in `src/client/modules/finances` (queries, mutations via `useAppMutation`, one schema + mapper per form) and opens its dialogs from the URL (`?dialog=transaction|category`, `id`, `entryKind`, `duplicate`) through `FinanceDialogHost`, next to Garage's host. The sidebar starts with **Today** (`/`, everything that needs action across modules), then Garage and Finances as always-open module groups; phones get Today / Garage / Finances / Settings.

## Reminders and notifications

- A reminder is due by date, by odometer, or by whichever comes first; it may recur by months and/or km.
- Status: `overdue` (past date or odometer reached), `due-soon` (within 7 days or 1,000 km), `upcoming`.
- **Finances** (`finances.cron.ts`, same daily trigger): one push per invoice the day after it becomes overdue (`overdue_notified_at`; skipped when "Remind me about overdue invoices" is off), tapping opens Mark paid; then purges soft-deleted finance records past the 7-day undo window, with their files.
- **One heads-up per reminder** (`notified_at`): the daily cron notifies date reminders 7 days ahead; logging an odometer reading checks km reminders immediately.
- **Odometer nudge**: if no reading has been logged for N weeks (setting, default 4, 0 = off), the cron sends one nudge per car per period.
- Completing a service reminder opens a prefilled service visit; saving it completes the reminder and schedules the next one when an interval is set. Insurance/registration reminders open a prefilled expense instead.

## Photos and documents

The Worker signs short-lived S3 URLs for Backblaze B2. The browser compresses photos (max 1600 px, WebP/JPEG ~0.8) and uploads directly; PDFs (invoices, receipts) go up unchanged, up to 10 MB. Views use 1-hour presigned GET URLs; PDFs are signed with `response-content-disposition: inline` and their original file name so they open in a new tab. If B2 is not configured, photo and attachment controls are hidden.

Locally the same code talks to [Garage](https://garagehq.deuxfleurs.fr/) (`docker-compose.yml`, `dev/garage/garage.toml`): `pnpm storage:up` starts it and `pnpm storage:setup` (`scripts/garage-setup.ts`) creates the bucket, key and CORS rule and fills `.dev.vars`. URLs are path-style (`endpoint/bucket/key`), which both B2 and Garage accept.

## Configuration

`wrangler.jsonc` holds bindings (D1, assets, cron). Secrets (`wrangler secret put`):

| Secret              | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `B2_ENDPOINT`       | e.g. `https://s3.eu-central-003.backblazeb2.com` |
| `B2_REGION`         | e.g. `eu-central-003`                            |
| `B2_BUCKET`         | bucket name                                      |
| `B2_KEY_ID`         | application key id (bucket-scoped)               |
| `B2_APP_KEY`        | application key                                  |
| `VAPID_PUBLIC_KEY`  | Web Push public key                              |
| `VAPID_PRIVATE_JWK` | Web Push private key (JWK JSON)                  |
| `VAPID_SUBJECT`     | `mailto:` contact for push services              |

For local dev put them in `.dev.vars` (git-ignored). See `README.md` for setup steps.

## Not in v1

Offline mode, family sharing UI, OCR, mileage-based due-date prediction.
