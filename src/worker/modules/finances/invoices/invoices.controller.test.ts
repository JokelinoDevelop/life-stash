import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { app } from "../../../app";
import { createDb } from "../../../core/db";
import { createTestHousehold } from "../../../test/households";
import { createTestD1 } from "../../../test/sqlite-d1";

const ORIGIN = "http://localhost";

type JsonBody = Record<string, string | number | boolean | null>;

const idBody = z.object({ id: z.string() });

const errorBody = z.object({
  error: z.object({ code: z.string(), field: z.string().optional() }),
});

const invoiceBody = z.object({
  invoice: z.object({
    status: z.string(),
    transaction: z
      .object({ amountMinor: z.number(), date: z.string() })
      .nullable(),
  }),
});

const listBody = z.object({
  invoices: z.array(z.object({ id: z.string(), status: z.string() })),
  stats: z.object({ overdueCount: z.number(), unpaidCount: z.number() }),
});

const ledgerBody = z.object({
  transactions: z.array(
    z.object({
      category: z.object({ systemKey: z.string().nullable() }),
      invoice: z.object({ number: z.string() }).nullable(),
    })
  ),
});

const read = async <T>(response: Response, schema: z.ZodType<T>) =>
  schema.parse(await response.json());

interface Session {
  cookie: string;
}

describe("invoices controller", () => {
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

  const createClient = async (
    session: Session,
    clientName = "Northwind Labs"
  ) =>
    await request(session, "POST", "/clients", {
      currency: "EUR",
      email: null,
      kind: "client",
      name: clientName,
      notes: null,
      paymentTermsDays: 30,
    });

  const createInvoice = async (
    session: Session,
    client: string,
    invoiceNumber: string
  ) =>
    await request(session, "POST", "/invoices", {
      amountMinor: 480_000,
      clientId: client,
      currency: "EUR",
      description: "Software development",
      dueDate: "2020-01-31",
      issueDate: "2020-01-01",
      markSent: true,
      notes: null,
      number: invoiceNumber,
      periodEnd: null,
      periodStart: null,
    });

  const setup = async () => {
    const { id: clientId } = await read(await createClient(alice), idBody);

    const { id: invoiceId } = await read(
      await createInvoice(alice, clientId, "2020-001"),
      idBody
    );

    return { clientId, invoiceId };
  };

  beforeEach(async () => {
    env = { DB: createTestD1().d1 };
    const db = createDb(env.DB);
    alice = await createTestHousehold(db, "alice");
    bob = await createTestHousehold(db, "bob");
  });

  it("hides invoices and clients from other households", async () => {
    const { clientId, invoiceId } = await setup();

    const statuses = await Promise.all([
      request(bob, "GET", `/invoices/${invoiceId}`),
      request(bob, "POST", `/invoices/${invoiceId}/mark-paid`, {
        amountMinor: 1,
        paidDate: "2020-02-01",
      }),
      request(bob, "GET", `/clients/${clientId}`),
    ]);

    expect(statuses.map((response) => response.status)).toStrictEqual([
      404, 404, 404,
    ]);
    await expect(
      read(await request(bob, "GET", "/invoices"), listBody)
    ).resolves.toMatchObject({ invoices: [] });
  });

  it("derives overdue and counts it as unpaid", async () => {
    await setup();

    const list = await read(
      await request(alice, "GET", "/invoices?year=2020"),
      listBody
    );

    expect(list.invoices.map((row) => row.status)).toStrictEqual(["overdue"]);
    expect(list.stats).toStrictEqual({ overdueCount: 1, unpaidCount: 1 });
  });

  it("books one income entry in Invoices when marked paid, and removes it when unpaid", async () => {
    const { invoiceId } = await setup();
    await request(alice, "POST", `/invoices/${invoiceId}/mark-paid`, {
      amountMinor: 470_000,
      paidDate: "2020-02-03",
    });

    const paid = await read(
      await request(alice, "GET", `/invoices/${invoiceId}`),
      invoiceBody
    );

    const ledger = await read(
      await request(alice, "GET", "/transactions"),
      ledgerBody
    );

    expect(paid.invoice).toStrictEqual({
      status: "paid",
      transaction: { amountMinor: 470_000, date: "2020-02-03" },
    });
    expect(ledger.transactions).toStrictEqual([
      { category: { systemKey: "invoices" }, invoice: { number: "2020-001" } },
    ]);

    await request(alice, "POST", `/invoices/${invoiceId}/mark-unpaid`);

    await expect(
      read(await request(alice, "GET", "/transactions"), ledgerBody)
    ).resolves.toStrictEqual({ transactions: [] });
  });

  it("books one entry when Mark paid is sent twice at once", async () => {
    const { invoiceId } = await setup();
    const payment = { amountMinor: 480_000, paidDate: "2020-02-03" };

    await Promise.all([
      request(alice, "POST", `/invoices/${invoiceId}/mark-paid`, payment),
      request(alice, "POST", `/invoices/${invoiceId}/mark-paid`, payment),
    ]);

    const ledger = await read(
      await request(alice, "GET", "/transactions"),
      ledgerBody
    );

    const invoice = await read(
      await request(alice, "GET", `/invoices/${invoiceId}`),
      invoiceBody
    );

    expect(ledger.transactions).toHaveLength(1);
    expect(invoice.invoice).toMatchObject({ status: "paid" });
  });

  it("locks paid invoices and their ledger entry", async () => {
    const { invoiceId } = await setup();
    await request(alice, "POST", `/invoices/${invoiceId}/mark-paid`, {
      amountMinor: 480_000,
      paidDate: "2020-02-03",
    });

    const edit = await request(alice, "PATCH", `/invoices/${invoiceId}`, {
      notes: "x",
    });

    const again = await request(
      alice,
      "POST",
      `/invoices/${invoiceId}/mark-paid`,
      {
        amountMinor: 1,
        paidDate: "2020-02-04",
      }
    );

    await expect(read(edit, errorBody)).resolves.toMatchObject({
      error: { code: "finances.invoice_already_paid" },
    });
    await expect(read(again, errorBody)).resolves.toMatchObject({
      error: { code: "finances.invoice_already_paid" },
    });
  });

  it("keeps invoice numbers and client names unique per household", async () => {
    const { clientId } = await setup();
    const duplicate = await createInvoice(alice, clientId, "2020-001");
    const sameName = await createClient(alice, "northwind labs");
    const { id: bobClient } = await read(await createClient(bob), idBody);

    await expect(read(duplicate, errorBody)).resolves.toStrictEqual({
      error: { code: "finances.invoice_number_taken", field: "number" },
    });
    await expect(read(sameName, errorBody)).resolves.toStrictEqual({
      error: { code: "finances.client_name_taken", field: "name" },
    });
    const bobInvoice = await createInvoice(bob, bobClient, "2020-001");

    expect(bobInvoice.status).toBe(201);
  });

  it("suggests the next number and refuses to delete a client in use", async () => {
    const { clientId } = await setup();
    const next = await request(alice, "GET", "/invoices/next-number");
    const removed = await request(alice, "DELETE", `/clients/${clientId}`);

    expect(next.status).toBe(200);
    await expect(read(removed, errorBody)).resolves.toMatchObject({
      error: { code: "finances.client_in_use" },
    });
  });
});
