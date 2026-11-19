# LifeStash — Implementation plan (post-v1 rework)

Status: **planned, not started** · Written 2026-11-19 · Visual design language v0.3 and the command menu shipped separately on 2026-11-19 (see `docs/DESIGN-LANGUAGE.md`)

This plan turns the working v1 Garage module into a cleaner codebase with a calmer, more premium UX. It is written so each phase can be picked up later, by a person or a coding agent, without the conversation that produced it.

Read `docs/ARCHITECTURE.md`, `docs/DATA-MODEL.md`, `AGENTS.md` and `CLAUDE.md` first. Every phase is one branch and one PR, and ends with `pnpm check` green.

## Scope

**In scope**

1. Backend restructure: Drizzle 1.0 RC, NestJS-style controller / service / repository modules, typed API errors, security hardening.
2. Frontend foundations: `useAppMutation` (toasts + undo), imperative `confirm()`, URL-driven dialogs, discard guard, server errors on form fields.
3. All create/edit pages move into dialogs; Playwright end-to-end tests.
4. Features: photo experience, search and filters.

**Deferred (do not start without asking)**

- Remaining visual polish (empty/loading states, the auth screens) and the full accessibility audit. Typography, palette, motion and the main screens are done (design language v0.3). New components follow `docs/DESIGN-LANGUAGE.md` and are built accessibly (see "Accessibility baseline").
- CI/deploy pipeline, staging environment, D1 → R2 backups, offline/persisted query cache. (The ⌘K command menu is done.)

## UX rules this plan implements

| Situation | Behaviour |
| --- | --- |
| Create / edit | Form in a `ResponsiveDialog` (dialog ≥ 768 px, bottom drawer below). No `/new` or `/edit` routes. |
| Form submit | No extra confirmation. Success toast; failures show on the field or as a toast. |
| Delete, irreversible actions, one-tap state changes (complete reminder, revoke passkey/session, regenerate recovery codes, archive car) | `confirm()` first. Deletes then show an **Undo** toast where the data can be restored. |
| Closing a dialog with unsaved changes | `confirm({ tone: "destructive", confirmLabel: discard })`. |
| Every mutation | Exactly one toast (success or error), produced by `useAppMutation`, never by hand. |

---

## Phase 1 — Backend restructure + security

No user-visible change except new security features and translated error messages. Split into commits in this order so each step is reviewable.

### 1.1 Upgrade to Drizzle 1.0 RC

- Install `drizzle-orm@rc` and `drizzle-kit@rc` (1.0.0-rc.5 at time of writing; pin the exact version).
- **Spike first: migrations.** drizzle-kit 1.0 changed its migrations folder layout. `wrangler d1 migrations apply` needs flat `migrations/NNNN_name.sql` files. Run `drizzle-kit up` on a copy, then check that:
  - `pnpm db:generate` still produces files wrangler can apply, and
  - existing migrations are not re-run against an existing local DB. If the layouts are incompatible, add `scripts/flatten-migrations.ts`, run it from `db:generate`, and document it in the README.
- Move relations to the v1 API (`defineRelations` in `src/worker/db/relations.ts`) and pass them to `drizzle(d1, { relations })` in `core/db.ts`.
- Write all new queries with the v2 relational query builder (`db.query.garageCars.findMany({ where: { householdId }, with: { … } })`). Use the SQL builder only where RQB can't express the query (aggregations in spending and mileage stats).
- Done when: all existing tests pass, `pnpm dev` works against an existing local DB, and a freshly generated migration applies with wrangler.

### 1.2 Module structure (controller / service / repository)

Target layout per feature (garage splits into its sub-features):

```
src/worker/
├─ core/
│  ├─ container.ts         per-request composition root (lazy getters)
│  ├─ errors.ts            DomainError + error codes + onError mapping
│  └─ …                    db, env, session, crypto, push, photo-storage
├─ modules/
│  ├─ garage/
│  │  ├─ cars/
│  │  │  ├─ cars.controller.ts     Hono sub-app: validate DTO → service → response mapper
│  │  │  ├─ cars.service.ts        business rules; no SQL, no Hono, no `c`
│  │  │  ├─ cars.repository.ts     Drizzle only; constructed with householdId
│  │  │  ├─ cars.module.ts         builds repository + service from the container
│  │  │  ├─ cars.service.test.ts   with in-memory fake repositories
│  │  │  ├─ cars.repository.test.ts  against real D1 (see 1.5)
│  │  │  └─ dto/…                  unchanged rule: one request + one response file per endpoint
│  │  ├─ expenses/ visits/ reminders/ mileage/ catalog/ spending/
│  │  ├─ garage.controller.ts      mounts the sub-controllers under /garage
│  │  └─ garage.cron.ts            uses the same services as the controllers
│  ├─ auth/ photos/ settings/
```

Rules:

- **Controllers** are chained Hono sub-apps, so `AppType` inference keeps working. A handler body is ~5 lines: read validated input → call one service method → map to response DTO → `c.json`. No `try/catch`, no Drizzle imports.
- **Services** are classes with constructor injection (`constructor(private readonly cars: CarsRepository, private readonly photos: PhotosService)`). They throw `DomainError`s. They call `src/shared/domain` for pure rules. Side effects that should not block the response (push heads-ups) go through an injected `defer(promise)` that wraps `executionCtx.waitUntil`, so services never touch Hono.
- **Repositories** receive `(db, householdId)` in the constructor and add the household filter to every query. `findCar`-style authorisation becomes `carsRepository.getOrThrow(carId)`. Repositories return rows; DTO mapping stays in the controller layer.
- **Container** (`core/container.ts`): created by middleware after `requireAuth` and stored as `c.var.container`. It exposes lazily-built services (`container.garage.expenses`). Public (unauthenticated) routes get a container without `householdId`, which only exposes auth services. The cron builds one container per household.
- **No DI framework or decorators** (cold-start cost on Workers, and decorators fight Hono RPC types).
- Cross-module calls go service → service, never into another module's repository.
- Migrate one module at a time (suggested order: expenses → mileage → catalog → reminders → visits → cars → spending → photos → settings → auth). Each module is its own commit with tests passing.

Done when: no route file imports from `drizzle-orm` or `db/schema`, no service imports `hono`, and every query goes through a household-scoped repository (except auth lookups by email/session, which live in `auth/*.repository.ts` without a household).

### 1.3 Typed API error contract

Replace the free-text `message` errors. Today `conflict("This car is archived")` reaches the UI as untranslated English.

- Error body (all non-2xx responses):
  ```ts
  { error: { code: ApiErrorCode; field?: string; params?: Record<string, string | number>; issues?: { field: string; code: string }[] } }
  ```
- `ApiErrorCode` is a namespaced string union in `core/errors.ts`, e.g. `common.not_found`, `common.validation`, `common.rate_limited`, `garage.car_archived`, `garage.reminder_already_completed`, `garage.unknown_catalog_item`, `auth.email_taken`, `auth.invalid_current_password`, `auth.last_credential`, `auth.challenge_expired`, `photos.not_configured`. Every current `throw badRequest/conflict/new ApiError(...)` (≈ 18 sites; find them with `grep -rn "throw " src/worker`) gets a specific code.
- `DomainError(code, { status, field?, params? })` with helpers (`notFound()`, `conflict(code)`, …). `handleError` serialises it, and never sends internal messages.
- `validate()` emits `issues: [{ field: "odometerKm", code: "too_small" }]`, using Zod issue codes and not messages.
- The client imports the union **as a type only** (`import type { ApiErrorCode } from "../../worker/core/errors"`), like `AppType`. No runtime schema is shared.
- i18n: new `errors` namespace (en + mk) with one key per code.

### 1.4 Security hardening

Current state: password login locks the _account_ after 5 failures for 15 min (`password.service.ts`). `/auth/recover` has **no** rate limit. Sessions last 90 days (sliding), with no list and no revoke.

- **Rate limiter service** (`core/rate-limit.ts`, D1 table `rate_limits(key TEXT PK, window_start TEXT, count INTEGER)`, fixed window, prune old rows in the daily cron):
  - `auth:password:ip:<ip>`: 20 per 15 min. `auth:password:email:<email>`: keep the existing per-account lock.
  - `auth:recover:ip:<ip>`: 5 per hour. `auth:recover:global`: 50 per hour (recovery codes are global, not per user).
  - `auth:passkey-options:ip:<ip>`: 30 per 15 min.
  - Use the IP from `cf-connecting-ip`. When limited, return `429` with `common.rate_limited` and `params.retryAfterSeconds`, plus a `Retry-After` header.
  - The per-IP limit also stops a third party from keeping the owner's account locked just by guessing.
- **Sessions:**
  - Migration: add `public_id` (uuid, for the UI; the PK is the token hash and must never be exposed), `last_seen_at`, `user_agent`, `created_ip_country` (from `request.cf.country`).
  - Update `last_seen_at` at most once per hour per session (avoids a write on every request).
  - Endpoints (each with its own DTOs): `GET /account/sessions` (marks the current one), `DELETE /account/sessions/:publicId`, `POST /account/sessions/revoke-others`.
  - Changing the password or email, or redeeming a recovery code, revokes all other sessions.
  - Settings → Security shows "Where you're signed in" with device (parsed UA: browser + OS), country, last seen, and revoke buttons (behind `confirm()`, built in Phase 2; until then the section ships without the confirm).
- **Session lifetime:** keep 90 days sliding, plus an absolute maximum of 1 year from `created_at`.
- Tests: limiter windows and reset, recovery limited after N attempts, revoke-others keeps the current session, password change revokes others.

### 1.5 Testing setup for the new layers

- Add `@cloudflare/vitest-pool-workers` as a second Vitest project (`src/worker/**/*.repository.test.ts`, `*.controller.test.ts`) running in workerd with a real local D1. Migrations are applied in `setupFiles` with `applyD1Migrations`. Keep the existing node project for pure tests.
- Service tests use hand-written in-memory fakes that implement the repository's public type (`type CarsRepositoryPort = Pick<CarsRepository, …>`). Don't mock Drizzle.
- A few controller tests via `app.request()` cover routing, DTO validation, error mapping and household isolation (household B can't read household A's car).

### 1.6 Docs

Update `ARCHITECTURE.md` (layers, container, error contract, rate limits, sessions), `DATA-MODEL.md` (new columns and tables), `CLAUDE.md` non-negotiables (no Drizzle outside repositories, no Hono outside controllers, typed error codes only), and the README (migration notes).

---

## Phase 2 — Frontend foundations

Builds the primitives. The only visible changes: toasts everywhere, consistent confirms, errors shown on fields. Existing pages keep working until Phase 3.

### 2.1 Feature folder shape (client)

```
src/client/modules/garage/expenses/
├─ expenses.queries.ts      queryOptions factories (keys from lib/query-keys.ts)
├─ expenses.mutations.ts    one hook per mutation, built on useAppMutation
├─ components/…
├─ dialogs/expense-form-dialog.tsx
└─ forms/expense-form/{schema.ts, mapper.ts, expense-form.tsx}
```

No component calls `api.*` directly; only `*.queries.ts` and `*.mutations.ts` do.

### 2.2 `useAppMutation` (`src/client/lib/mutation.ts`)

```ts
useAppMutation({
  mutationFn,                         // calls unwrap(api…)
  invalidate: [garageKeys.car(carId)],// query keys to invalidate on success
  success: t("expenses:deleted"),     // string | (data) => string | false
  undo?: (data) => Promise<void>,     // adds an "Undo" action to the success toast
  optimistic?: { queryKey, update },  // optional optimistic cache update + rollback
})
```

- Errors: a `common.validation` error, or one with `field`, is _not_ toasted when the caller has registered a form (see 2.5). Every other error → `toast.error(errorMessage(error))`.
- Undo for deletes: the backend gets a restore path per deletable entity. Pick one approach in the PR and apply it everywhere:
  - (a) soft delete with a `deleted_at` column plus a purge in the daily cron after 7 days, or
  - (b) the client re-POSTs the snapshot it already has. **Recommended: (a).** It keeps ids, photos and reminder links intact.
- Unit-test with a QueryClient and a mocked `mutationFn`.

### 2.3 `confirm()` (`src/client/components/app/confirm/`)

- `ConfirmProvider` is mounted once in `app.tsx` next to `<Toaster />`. `useConfirm()` returns `confirm(options): Promise<boolean>`.
- Options: `title?`, `description?`, `confirmLabel?`, `cancelLabel?`, `tone: "default" | "destructive"`, `action?: () => Promise<unknown>`.
  - With `action`, the dialog shows a spinner, stays open while it runs, closes on success, and stays open on failure (the mutation already toasted the error).
- Rendered with `AlertDialog` on desktop and `Drawer` on mobile (reuse `useIsDesktop`). Only one dialog can be open; a second call while open rejects the first with `false`.
- Initial focus on **Cancel**; Esc and outside click resolve `false`; focus returns to the trigger.
- Delete `confirm-dialog.tsx` once all callers have moved (`grep -rn ConfirmDialog src/client`).
- Simple yes/no questions only. A confirmation that needs input (type-to-confirm, options) is a normal dialog.

### 2.4 URL-driven dialogs (`src/client/components/app/route-dialog.tsx`)

> **Done (differently):** create/edit dialogs are URL-driven from the `_app` route (`?dialog=…&car=…&id=…&reminder=…`) via `modules/garage/entry-dialogs`, rendered by one `EntryDialogHost`; the discard guard from 2.5 is in `FormDialog`. See DESIGN-LANGUAGE "Forms and dialogs".

- The open dialog lives in the route's search params, e.g. `?dialog=expense-new`, `?dialog=expense-edit&expenseId=…`, `?dialog=visit-new&reminderId=…`. Each route that hosts dialogs declares them in `validateSearch` (Zod discriminated union on `dialog`).
- `useRouteDialog(name)` returns `{ open, params, show(params), close() }`. `show` pushes a history entry, so the phone/browser Back button closes the dialog. `close` goes back if the dialog opened in-app, or replaces the URL if the page was opened directly from a deep link.
- `ResponsiveDialog` gets a `size: "default" | "wide" | "full"` variant (`wide` for the visit form; `full` = full-height drawer on mobile). Per CLAUDE.md the variant is added in `components/app`, not by restyling shadcn.
- Dialog content loads its own data (edit dialogs fetch by id from the search params) and shows a skeleton while loading.

### 2.5 Forms: discard guard + server errors

- `useFormDialog(form)` wires a TanStack Form instance to the dialog:
  - on close with `form.state.isDirty` → `confirm({ tone: "destructive", title: t("discard.title"), confirmLabel: t("actions.discard") })`;
  - after a successful submit → close without asking.
- `applyServerErrors(form, error)`: for `issues[]` and `field`, set the field's error map with a `validation.server.<code>` key so the message shows under the input. Return `true` when it handled the error, so `useAppMutation` skips the toast.
- Mappers own the field-name translation when the API field differs from the form field (e.g. `odometerKm` → `odometer`).

### Accessibility baseline (applies to everything built in Phases 2–3)

Built-in focus trap and restore (Radix/vaul defaults, don't override); every dialog has a title, plus a description or `aria-describedby={undefined}`; touch targets ≥ 44 px on mobile actions; no motion beyond the shadcn defaults, and `motion-reduce:` respected; toasts are announced (sonner does this). The full audit is deferred with the polish pass.

---

## Phase 3 — Forms into dialogs + end-to-end tests

### 3.1 Replace routes with dialogs

| Remove route | Replacement (hosted on) |
| --- | --- |
| `garage/cars/new.tsx` | `car-new` dialog on `/garage` |
| `garage/cars/$carId/edit.tsx` | `car-edit` dialog on `/garage/cars/$carId` |
| `…/expenses/new.tsx` (incl. `?reminderId`) | `expense-new` dialog on the car page |
| `…/expenses/$expenseId/edit.tsx` | `expense-edit` dialog on the car page (delete moves to the row menu + confirm + undo) |
| `…/services/new.tsx` (incl. reminder prefill) | `visit-new` dialog, size `wide` |
| `…/services/$visitId/edit.tsx` | `visit-edit` dialog, size `wide` |
| `…/reminders/new.tsx` | `reminder-new` dialog |
| `…/reminders/$reminderId/edit.tsx` | `reminder-edit` dialog |

- `services/$visitId/index.tsx` (visit detail) stays a page for now.
- Update every link and `navigate()` to these routes (`grep -rn "/new\"\|/edit\"" src/client`), and the push notification URLs in `src/worker/modules/garage/notifications.ts` (and the cron), so a reminder notification opens `/garage/cars/<id>?tab=reminders&dialog=…`.
- Reminder completion: "Complete" on a reminder → `confirm()` for reminders with no follow-up form; for service and insurance/registration reminders it opens `visit-new` / `expense-new` with `reminderId` (the current prefill logic moves into the dialog).
- Move the existing mileage/catalog `ResponsiveDialog` usages onto `useRouteDialog` as well, for consistent Back-button behaviour.
- Migrate every remaining mutation (catalog, mileage, photos, settings, passkeys, recovery codes, sessions) to `*.mutations.ts` + `useAppMutation`, and every destructive action to `confirm()`. Done when: `grep -rn "toast\." src/client/modules src/client/routes` only matches auth pages that aren't mutations, and `grep -rn "api\." src/client` only matches `*.queries.ts`, `*.mutations.ts` and `lib/`.

### 3.2 Playwright

- `pnpm add -D @playwright/test`; `playwright.config.ts` starts `pnpm dev` on a dedicated port, with a separate wrangler persist dir (`.wrangler/e2e`) that is wiped and migrated in `globalSetup`.
- Auth: `globalSetup` runs first-run setup with email + password (test values written to `e2e/fixtures/user.ts`) and saves `storageState`. Passkeys are not tested end-to-end (Playwright has a virtual authenticator, but keep that for later).
- Projects: desktop Chromium + mobile (Pixel 7 emulation), so both dialog and drawer paths run.
- Specs (`e2e/*.spec.ts`):
  - `cars`: add car via dialog → appears in list → edit → archive (confirm) → unarchive.
  - `expenses`: add, edit, delete → Undo restores it; validation error shows on the field.
  - `reminders`: create a date reminder → complete via the prefilled expense dialog → next reminder scheduled.
  - `visits`: log a service with two catalog items (wide dialog / full drawer).
  - `mileage`: log a reading lower than the last one → server error shown on the field.
  - `dialogs`: Back button closes the dialog; closing a dirty form asks to discard; a deep link `?dialog=expense-new` opens it.
  - `security`: sessions list shows the current session; revoke-others.
- Scripts: `pnpm e2e` (headless) and `pnpm e2e:ui`. E2E is **not** added to `pnpm check` (too slow for the pre-commit hook); run it before merging each phase from here on.

---

## Phase 4 — Features

### 4.1 Photos

Already in place: client-side downscale to 1600 px WebP/JPEG (`modules/photos/compress.ts`), presigned B2 uploads, a gallery.

- **Thumbnails:** generate a second 400 px WebP alongside the main image in `compress.ts`, upload both (`objectKey` + `thumbKey`), and use thumbnails in lists and grids. Migration adds `thumb_key`, `width`, `height` and `placeholder` to `photos`.
- **Placeholder:** compute a ThumbHash (`thumbhash` package, ~25 bytes, stored base64 in `placeholder`) on the client before upload. Render it as a blurred background until the image loads, and reserve the aspect ratio from `width`/`height` so the layout doesn't jump.
- **Viewer:** a full-screen lightbox (Dialog `full` variant) with swipe on mobile, arrow keys and Esc on desktop, a counter, and delete (confirm + toast). Open it via search param `?photo=<id>` so Back closes it.
- **Upload UX:** multi-select, per-file progress (XHR upload, since `fetch` has no upload progress), retry on failure, and a toast summary.
- **Car cover photo (optional, ask first):** a new owner type `car`, shown on the car card and header.
- Presigned GET URLs: cache them in TanStack Query with `staleTime` just under their 1-hour expiry, so images don't re-download on every render.

### 4.2 Search and filters

- Lists: expenses (text in notes/vendor, category, year, amount range), service history (text, catalog item, year), reminders (status, kind), readings (year).
- Filters live in the route's search params (`validateSearch`), so they survive refresh, the Back button and sharing. Text input is debounced 250 ms and uses `replace` navigation so typing doesn't spam history.
- Filtering runs on the server: extend each list endpoint's request DTO (`list-expenses.request.ts` etc.) and repository. Text search is `LIKE` on indexed lower-cased columns. At household scale, FTS5 is not needed. Revisit if a list exceeds a few thousand rows.
- UI: a filter bar (search input + `ToggleGroup` / `Select` chips) above each list. On mobile, the filters collapse into a "Filters" drawer with an active-count badge. "Clear filters" shows when any filter is active, and empty results show a "no matches" state distinct from "no data yet".
- Use `placeholderData: keepPreviousData` so the list doesn't flash while filters change.

---

## Suggested execution

Phases run in order. 1 and 2 touch disjoint files (worker vs. client) and could run in parallel once the error contract (1.3) is merged first. Each phase ends with: `pnpm check` green, docs updated, and from Phase 3 on, `pnpm e2e` green.
