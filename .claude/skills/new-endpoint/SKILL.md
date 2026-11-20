---
name: new-endpoint
description: Add or change a LifeStash API endpoint (Hono, Cloudflare Worker) the house way — per-endpoint request/response DTOs, controller → service → repository, householdId scoping, typed errors and tests. Use whenever you add a route under /api/*, change what one accepts or returns, or add a feature that needs new API calls.
---

# New endpoint

Reference implementation: `src/worker/modules/finances/categories/` (controller, service, repository, `dto/`, service test) and `finances/invoices/invoices.controller.test.ts`. Read the matching files there before writing; copy their shape, not just these notes.

Garage still uses older `*.routes.ts` + `*.service.ts` files. New Garage work may follow that file's local style, but new features and new modules use the layered layout below.

## 1. DTOs — one pair per endpoint, never shared

`<feature>/dto/<verb>-<thing>.request.ts` and `<verb>-<thing>.response.ts`, e.g. `create-category.request.ts`.

- **Request**: a Zod schema named `<verb><Thing>Request` (body) and/or `<verb><Thing>Params` / `…Query`. Use `core/zod-primitives.ts` (`shortText`, `optionalText`, `isoDate`, `currency`, `kilometres`, `moneyMinor`). Ids are `z.uuid()`. PATCH bodies: every field `.optional()`.
- **Response**: an `interface <Verb><Thing>Response` plus a `to<Verb><Thing>Response(rows)` mapper when it returns data. Map every field explicitly; never spread or return a DB row. Booleans derived from columns (`archived: row.archivedAt !== null`) are mapped here.
- Even if two endpoints return the same shape, write two files. A GET with no input has no request file.
- Units: distance in km, money as integer minor units + ISO currency. No conversion on the server.

## 2. Repository — `(db, householdId)`, scopes every query

- Class `<Thing>Repository` with `readonly #db` and `readonly #householdId`, constructed with `(db, householdId)`.
- **Every** select/update/delete has `eq(table.householdId, this.#householdId)` in its `where`; inserts set `householdId` from the field, never from input.
- Export the row types (`typeof table.$inferSelect`) and a `…RepositoryPort = Pick<…>` type that the service depends on, so tests can pass an in-memory fake.
- The only layer that imports Drizzle.

## 3. Service — the rules, no Hono

- Takes repository ports (and a `now: () => Date` when time matters) by constructor.
- Business failures: `domainError("<module>.<reason>", { field })` (add the code to `FinanceErrorCode` / `ApiErrorCode` in `core/errors.ts`); missing records: `throw notFound()`.
- Deletes are soft (`deletedAt`) when the UI offers Undo, with a `POST …/:id/restore`.
- Wire it in the module factory (`finances.module.ts` → `createFinancesModule`), reached in controllers as `c.var.container.<module>.<service>`.

## 4. Controller — validate, call one method, map

```ts
export const thingsController = new Hono<AppEnv>().post(
  "/",
  validate("json", createThingRequest),
  async (c) => {
    const row = await c.var.container.finances.things.create(
      c.req.valid("json")
    );
    const body: CreateThingResponse = { id: row.id };

    return c.json(body, 201);
  }
);
```

- `validate` from `core/validate`; annotate `const body: <Response> = …` so the DTO type is enforced.
- No Drizzle imports, no business rules. Chain the routes (Hono RPC needs the chained type) and mount with `.route("/things", thingsController)` in the module's controller.
- **Car-scoped routes** must authorise the car first with `findCar(db, householdId, carId)` (`garage/cars/cars.service`) and 404 when it is missing.

## 5. Tests

- **Service**: `<thing>.service.test.ts` with an in-memory fake of the repository port (see `categories.service.test.ts`). Cover the rules and error codes.
- **Controller** (for anything non-trivial): `app.request()` against `createTestD1()` + `createTestHousehold()`; always include a **household isolation** case (Bob can't read or change Alice's record → 404).

## 6. Client side

- Types flow through Hono RPC: use `InferRequestType<typeof api.<module>.<path>.$post>["json"]` in the client mapper/mutation; never import worker DTOs into the client.
- Queries in `<feature>.queries.ts`, mutations via `useAppMutation` (`invalidate`, `success` toast) in `<feature>.mutations.ts`.
- New error codes get a translation under `<namespace>:errors.*` in **both** `en` and `mk`.
- If a form posts to it, use the `new-form` skill.

## 7. Schema changes and demo data

If you touched `src/worker/db/schema/*`: `pnpm db:generate`, then `pnpm db:migrate:local`. Extend `src/worker/db/seed/` so the feature shows up after `pnpm db:seed`. Update `docs/DATA-MODEL.md` / `docs/ARCHITECTURE.md` when the model or a rule changes.

## Done when

- [ ] Own request + response DTO files; no row leaves without a mapper
- [ ] Every query filtered by `householdId`; car routes use `findCar`
- [ ] Controller has no Drizzle; service has no Hono
- [ ] Service test (+ controller test with isolation when it writes data)
- [ ] Error codes translated in `en` and `mk`
- [ ] `pnpm check` passes
