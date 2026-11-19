import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { app } from "../../app";
import { createDb } from "../../core/db";
import { createTestHousehold } from "../../test/households";
import { createTestD1 } from "../../test/sqlite-d1";

const ORIGIN = "http://localhost";

const categoriesBody = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      kind: z.string(),
      systemKey: z.string().nullable(),
    })
  ),
});

const listBody = z.object({
  months: z.array(
    z.object({
      entries: z.number(),
      expense: z.array(
        z.object({ amountMinor: z.number(), currency: z.string() })
      ),
      income: z.array(
        z.object({ amountMinor: z.number(), currency: z.string() })
      ),
      month: z.string(),
    })
  ),
  nextCursor: z.string().nullable(),
  total: z.number().nullable(),
  transactions: z.array(z.object({ description: z.string(), id: z.string() })),
});

const createdBody = z.object({ id: z.string() });

const errorBody = z.object({
  error: z.object({ code: z.string(), field: z.string().optional() }),
});

interface Session {
  cookie: string;
}

type JsonBody = Record<string, string | number | boolean | null>;

const read = async <T>(response: Response, schema: z.ZodType<T>) =>
  schema.parse(await response.json());

const expense = (category: string, day = "2026-11-19") => ({
  amountMinor: 4620,
  categoryId: category,
  currency: "EUR",
  date: day,
  description: `Groceries ${day}`,
  kind: "expense",
  notes: null,
});

describe("finances controller", () => {
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

  const categoryOf = async (session: Session, kind: string) => {
    const { categories } = await read(
      await request(session, "GET", "/categories"),
      categoriesBody
    );

    return (
      categories.find((row) => row.kind === kind && row.systemKey === null)
        ?.id ?? ""
    );
  };

  const list = async (session: Session) =>
    await read(await request(session, "GET", "/transactions"), listBody);

  beforeEach(async () => {
    env = { DB: createTestD1().d1 };
    const db = createDb(env.DB);
    alice = await createTestHousehold(db, "alice");
    bob = await createTestHousehold(db, "bob");
  });

  it("seeds default categories on first use, with Invoices as a system category", async () => {
    const { categories } = await read(
      await request(alice, "GET", "/categories"),
      categoriesBody
    );

    expect(categories.filter((row) => row.kind === "expense")).toHaveLength(10);
    expect(
      categories.filter((row) => row.systemKey === "invoices")
    ).toHaveLength(1);
  });

  it("hides one household's transactions from another", async () => {
    const categoryId = await categoryOf(alice, "expense");

    const { id } = await read(
      await request(alice, "POST", "/transactions", expense(categoryId)),
      createdBody
    );

    const bobRead = await request(bob, "GET", `/transactions/${id}`);

    const bobEdit = await request(bob, "PATCH", `/transactions/${id}`, {
      description: "x",
    });

    const bobDelete = await request(bob, "DELETE", `/transactions/${id}`);

    expect([bobRead.status, bobEdit.status, bobDelete.status]).toStrictEqual([
      404, 404, 404,
    ]);
    await expect(list(bob)).resolves.toMatchObject({ total: 0 });
  });

  it("refuses another household's category", async () => {
    const categoryId = await categoryOf(alice, "expense");

    const response = await request(
      bob,
      "POST",
      "/transactions",
      expense(categoryId)
    );

    expect(response.status).toBe(404);
  });

  it("summarises the whole filtered set per month", async () => {
    const categoryId = await categoryOf(alice, "expense");
    await request(alice, "POST", "/transactions", expense(categoryId));
    const { months, total } = await list(alice);

    expect(total).toBe(1);
    expect(months).toStrictEqual([
      {
        entries: 1,
        expense: [{ amountMinor: 4620, currency: "EUR" }],
        income: [],
        month: "2026-11",
      },
    ]);
  });

  it("lists newest first and undoes a delete", async () => {
    const categoryId = await categoryOf(alice, "expense");
    await request(
      alice,
      "POST",
      "/transactions",
      expense(categoryId, "2026-10-01")
    );
    await request(
      alice,
      "POST",
      "/transactions",
      expense(categoryId, "2026-10-03")
    );
    const { transactions } = await list(alice);
    const [newest] = transactions;

    expect(transactions.map((row) => row.description)).toStrictEqual([
      "Groceries 2026-10-03",
      "Groceries 2026-10-01",
    ]);

    await request(alice, "DELETE", `/transactions/${newest?.id}`);

    await expect(list(alice)).resolves.toMatchObject({ total: 1 });

    await request(alice, "POST", `/transactions/${newest?.id}/restore`);

    await expect(list(alice)).resolves.toMatchObject({ total: 2 });
  });

  it("rejects a category of the other kind with a typed error on the field", async () => {
    const categoryId = await categoryOf(alice, "income");

    const response = await request(
      alice,
      "POST",
      "/transactions",
      expense(categoryId)
    );

    expect(response.status).toBe(400);
    await expect(read(response, errorBody)).resolves.toStrictEqual({
      error: { code: "finances.category_kind_mismatch", field: "categoryId" },
    });
  });
});
