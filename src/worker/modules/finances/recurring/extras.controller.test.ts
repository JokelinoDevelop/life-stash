import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { app } from "../../../app";
import { createDb } from "../../../core/db";
import { createTestHousehold } from "../../../test/households";
import { createTestD1 } from "../../../test/sqlite-d1";

const ORIGIN = "http://localhost";

type JsonBody = Record<string, string | number | boolean | null>;

const idBody = z.object({ id: z.string() });

const categoriesBody = z.object({
  categories: z.array(z.object({ id: z.string(), name: z.string() })),
});

const overviewBody = z.object({
  toConfirm: z.array(z.object({ description: z.string() })),
});

const ledgerBody = z.object({ total: z.number().nullable() });
const errorBody = z.object({ error: z.object({ code: z.string() }) });

const read = async <T>(response: Response, schema: z.ZodType<T>) =>
  schema.parse(await response.json());

interface Session {
  cookie: string;
}

describe("recurring, projects and export", () => {
  let env = { DB: createTestD1().d1 };
  let alice: Session = { cookie: "" };
  let bob: Session = { cookie: "" };

  const request = async (
    session: Session,
    method: string,
    path: string,
    body?: JsonBody
  ) =>
    await app.request(
      `${ORIGIN}/api/finances${path}`,
      {
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: {
          "content-type": "application/json",
          cookie: session.cookie,
          origin: ORIGIN,
        },
        method,
      },
      env
    );

  const salaryTemplate = async () => {
    const { categories } = await read(
      await request(alice, "GET", "/categories"),
      categoriesBody
    );

    const salary = categories.find((row) => row.name === "Salary")?.id ?? "";

    return await read(
      await request(alice, "POST", "/recurring", {
        active: true,
        amountMinor: 210_000,
        categoryId: salary,
        clientId: null,
        currency: "EUR",
        dayOfMonth: 25,
        description: "Salary",
        kind: "income",
      }),
      idBody
    );
  };

  beforeEach(async () => {
    env = { DB: createTestD1().d1 };
    const db = createDb(env.DB);
    alice = await createTestHousehold(db, "alice");
    bob = await createTestHousehold(db, "bob");
  });

  it("asks once a month: confirm books one entry and clears the row", async () => {
    const { id } = await salaryTemplate();

    const before = await read(
      await request(alice, "GET", "/overview"),
      overviewBody
    );

    expect(before.toConfirm.map((row) => row.description)).toStrictEqual([
      "Salary",
    ]);

    await request(alice, "POST", `/recurring/${id}/confirm`);

    const after = await read(
      await request(alice, "GET", "/overview"),
      overviewBody
    );

    const ledger = await read(
      await request(alice, "GET", "/transactions"),
      ledgerBody
    );

    expect(after.toConfirm).toStrictEqual([]);
    expect(ledger.total).toBe(1);
  });

  it("skips without booking, and keeps templates per household", async () => {
    const { id } = await salaryTemplate();
    const bobConfirm = await request(bob, "POST", `/recurring/${id}/confirm`);
    await request(alice, "POST", `/recurring/${id}/skip`);

    const ledger = await read(
      await request(alice, "GET", "/transactions"),
      ledgerBody
    );

    expect(bobConfirm.status).toBe(404);
    expect(ledger.total).toBe(0);
  });

  it("refuses to delete a project that has invoices and hides it from other households", async () => {
    const { id: clientId } = await read(
      await request(alice, "POST", "/clients", {
        currency: "EUR",
        email: null,
        kind: "client",
        name: "Northwind",
        notes: null,
        paymentTermsDays: 30,
      }),
      idBody
    );

    const { id: projectId } = await read(
      await request(alice, "POST", "/projects", {
        clientId,
        name: "Website",
        notes: null,
      }),
      idBody
    );

    // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
    await request(alice, "POST", "/invoices", {
      amountMinor: 100,
      clientId,
      currency: "EUR",
      description: null,
      dueDate: "2026-02-01",
      issueDate: "2026-01-01",
      markSent: false,
      notes: null,
      number: "2026-001",
      periodEnd: null,
      periodStart: null,
      projectId,
    });
    const removed = await request(alice, "DELETE", `/projects/${projectId}`);

    const bobEdit = await request(bob, "PATCH", `/projects/${projectId}`, {
      name: "x",
    });

    await expect(read(removed, errorBody)).resolves.toMatchObject({
      error: { code: "finances.project_in_use" },
    });
    expect(bobEdit.status).toBe(404);
  });

  it("exports a year of transactions as CSV with a header row", async () => {
    await salaryTemplate().then(
      async ({ id }) => await request(alice, "POST", `/recurring/${id}/confirm`)
    );
    const year = new Date().getUTCFullYear();

    const response = await request(
      alice,
      "GET",
      `/export.csv?type=transactions&year=${year}`
    );

    const bytes = new Uint8Array(await response.arrayBuffer());
    // The BOM (EF BB BF) makes spreadsheet apps read UTF-8; text() strips it.
    const text = new TextDecoder().decode(bytes);

    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(bytes.subarray(0, 3).join(",")).toBe("239,187,191");
    expect(text.split("\r\n")[0]).toBe(
      "date,kind,description,category,client,amount,currency,notes"
    );
    expect(text).toContain("income,Salary,Salary,,2100,EUR,");
  });
});
