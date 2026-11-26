# LifeStash — notes for coding agents

Read `docs/ARCHITECTURE.md` and `docs/DATA-MODEL.md` first. Code standards are in `AGENTS.md`. UI follows `docs/DESIGN-LANGUAGE.md`. Planned rework (phases, scope, UX rules): `docs/IMPLEMENTATION-PLAN.md`. Finances: `docs/FINANCES-SPEC.md`; invoice documents (F4): `docs/INVOICE-DOCUMENTS-SPEC.md`.

## Non-negotiable rules

- One Cloudflare Worker: Hono API under `/api/*` + the React SPA as static assets.
- Every endpoint has its **own** request DTO (`dto/<endpoint>.request.ts`, Zod) and response DTO (`dto/<endpoint>.response.ts`). Never share DTOs between endpoints; never return DB rows directly.
- Every form has its **own** `schema.ts` (Zod, string inputs, `validation.*` message keys) and `mapper.ts` (form values ⇄ API types). Client and server never share a schema.
- `src/shared/domain` is pure logic only (dates, units, money, reminders, mileage, spending), with tests.
- Every query is scoped by `householdId`. Car-scoped requests authorise with `findCar`.
- Store km and integer minor units; convert only at the UI edge (`useFormat`, `displayToKm`).
- All user-facing text goes through i18next (`en` + `mk`), one namespace per feature.
- Use shadcn components as-is (no restyling of spacing/colour); add a variant in `components/ui` when a design needs one.

## Commands

- `pnpm dev` — app + worker locally (D1 runs locally; apply migrations with `pnpm db:migrate:local`).
- `pnpm check` — route generation, typecheck, lint, tests. Must pass before committing.
- `pnpm fix` — auto-fix formatting and lint.
- `pnpm test:layout` — Playwright: every page at 390px and 360px must not overflow sideways (needs the seeded local D1; reuses or starts `pnpm dev`). Run it after UI changes.
- `pnpm screenshots` — Playwright: README screenshots of the seeded demo (desktop + phone, light + dark) into `docs/screenshots/`. Re-run after visible UI changes to the pages shown.
- `pnpm db:generate` — create a migration after changing `src/worker/db/schema/*`.
- `pnpm release` — ship to production: check, version bump + tag, build, remote migrations, deploy, verify `/api/version`, push (`--dry-run` to rehearse). See README › Releasing updates.
- `pnpm db:seed` — demo data in the local D1 (`src/worker/db/seed/`). When you add a table or feature, extend the fixtures and seeders so it shows up in the demo.
