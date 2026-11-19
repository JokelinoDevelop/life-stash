# LifeStash — notes for coding agents

Read `docs/ARCHITECTURE.md` and `docs/DATA-MODEL.md` first. Code standards are in `AGENTS.md`. UI follows `docs/DESIGN-LANGUAGE.md`. Planned rework (phases, scope, UX rules): `docs/IMPLEMENTATION-PLAN.md`.

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
- `pnpm db:generate` — create a migration after changing `src/worker/db/schema/*`.
