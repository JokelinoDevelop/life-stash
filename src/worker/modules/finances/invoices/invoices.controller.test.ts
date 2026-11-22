import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { app } from "../../../app";
import { createDb } from "../../../core/db";
import { createTestHousehold } from "../../../test/households";
import { createTestD1 } from "../../../test/sqlite-d1";

const ORIGIN = "http://localhost";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonBody = Record<string, JsonValue>;

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

const numberBody = z.object({
  number: z.string(),
  previous: z.string().nullable(),
});

const detailBody = z.object({
  invoice: z.object({
    clientSnapshot: z.unknown().optional(),
    issuedAt: z.string().nullable(),
    number: z.string().nullable(),
    status: z.string(),
  }),
});

const documentBody = z.object({
  document: z.object({
    client: z.object({ name: z.string() }),
    issuer: z.object({ name: z.string() }).nullable(),
    lines: z.array(
      z.object({ amountMinor: z.number(), unit: z.string().nullable() })
    ),
    number: z.string().nullable(),
    totals: z.object({ totalMinor: z.number() }),
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
  householdId: string;
}

describe("invoices controller", () => {
  let env = { DB: createTestD1().d1 };
  let alice: Session = { cookie: "", householdId: "" };
  let bob: Session = { cookie: "", householdId: "" };

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
    invoiceNumber: string | null
  ) =>
    await request(session, "POST", "/invoices", {
      amountMinor: 480_000,
      clientId: client,
      currency: "EUR",
      description: "Software development",
      dueDate: "2020-01-31",
      issue: invoiceNumber !== null,
      issueDate: "2020-01-01",
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

  it("keeps drafts unnumbered and numbers them per year when issued", async () => {
    const { clientId } = await setup();

    const { id: draftId } = await read(
      await createInvoice(alice, clientId, null),
      idBody
    );

    const draft = await read(
      await request(alice, "GET", `/invoices/${draftId}`),
      detailBody
    );

    const next = await read(
      await request(alice, "GET", "/invoices/next-number?year=2020"),
      numberBody
    );

    const issued = await request(alice, "POST", `/invoices/${draftId}/issue`, {
      number: null,
    });

    expect(draft.invoice).toMatchObject({ issuedAt: null, number: null });
    expect(next).toStrictEqual({ number: "2020-002", previous: "2020-001" });
    await expect(
      read(issued, numberBody.pick({ number: true }))
    ).resolves.toStrictEqual({ number: "2020-002" });
    await expect(
      read(await request(alice, "GET", `/invoices/${draftId}`), detailBody)
    ).resolves.toMatchObject({
      invoice: { number: "2020-002", status: "overdue" },
    });
  });

  it("counts a plain legacy number as a sequence of its issue year", async () => {
    const { clientId } = await setup();
    await createInvoice(alice, clientId, "011");

    const clash = await createInvoice(alice, clientId, "2020-011");
    const otherYear = await createInvoice(alice, clientId, "2019-012");

    await expect(
      read(
        await request(alice, "GET", "/invoices/next-number?year=2020"),
        numberBody
      )
    ).resolves.toStrictEqual({ number: "2020-012", previous: "011" });
    await expect(read(clash, errorBody)).resolves.toStrictEqual({
      error: { code: "finances.invoice_number_taken", field: "number" },
    });
    await expect(read(otherYear, errorBody)).resolves.toStrictEqual({
      error: { code: "finances.invoice_number_invalid", field: "number" },
    });
  });

  it("locks issued invoices: notes only, void instead of delete", async () => {
    const { invoiceId } = await setup();

    const edit = await request(alice, "PATCH", `/invoices/${invoiceId}`, {
      amountMinor: 1,
    });

    const notes = await request(alice, "PATCH", `/invoices/${invoiceId}`, {
      notes: "Paid in two parts",
    });

    const removed = await request(alice, "DELETE", `/invoices/${invoiceId}`);
    const voided = await request(alice, "POST", `/invoices/${invoiceId}/void`);

    await expect(read(edit, errorBody)).resolves.toMatchObject({
      error: { code: "finances.invoice_issued" },
    });
    expect(notes.status).toBe(200);
    await expect(read(removed, errorBody)).resolves.toMatchObject({
      error: { code: "finances.invoice_issued" },
    });
    expect(voided.status).toBe(200);
    await expect(
      read(
        await request(alice, "GET", "/invoices/next-number?year=2020"),
        numberBody
      )
    ).resolves.toMatchObject({ number: "2020-002" });
  });

  it("deletes drafts and refuses to void them", async () => {
    const { clientId } = await setup();

    const { id: draftId } = await read(
      await createInvoice(alice, clientId, null),
      idBody
    );

    const voided = await request(alice, "POST", `/invoices/${draftId}/void`);
    const removed = await request(alice, "DELETE", `/invoices/${draftId}`);

    await expect(read(voided, errorBody)).resolves.toMatchObject({
      error: { code: "finances.invoice_not_issued" },
    });
    expect(removed.status).toBe(200);
  });

  it("keeps issuing, voiding and editing inside the household", async () => {
    const { clientId, invoiceId } = await setup();

    const { id: draftId } = await read(
      await createInvoice(alice, clientId, null),
      idBody
    );

    const statuses = await Promise.all([
      request(bob, "POST", `/invoices/${draftId}/issue`, { number: null }),
      request(bob, "POST", `/invoices/${invoiceId}/void`),
      request(bob, "PATCH", `/invoices/${draftId}`, { notes: "x" }),
      request(bob, "DELETE", `/invoices/${draftId}`),
    ]);

    expect(statuses.map((response) => response.status)).toStrictEqual([
      404, 404, 404, 404,
    ]);
  });

  const PROFILE = {
    address: "Ulica 1",
    bankAddress: null,
    bankCountry: null,
    bankName: null,
    companyId: null,
    defaultVatRateBp: 0,
    email: null,
    footerNote: "Not a VAT payer",
    iban: "MK07300000000042425",
    name: "Jane Dev",
    phone: null,
    swift: null,
    taxId: null,
    vatRegistered: false,
  } satisfies JsonBody;

  const createItemised = async (session: Session, client: string) =>
    await request(session, "POST", "/invoices", {
      amountMinor: 0,
      clientId: client,
      currency: "EUR",
      description: "Thank you!",
      dueDate: "2020-01-31",
      issue: false,
      issueDate: "2020-01-01",
      lines: [
        {
          description: "Development",
          quantityMilli: 80_000,
          unit: "hrs",
          unitPriceMinor: 4000,
          vatRateBp: 0,
        },
        {
          description: "Hosting",
          quantityMilli: 1000,
          unit: null,
          unitPriceMinor: 2500,
          vatRateBp: 0,
        },
      ],
      notes: null,
      number: null,
      periodEnd: null,
      periodStart: null,
    });

  it("computes itemised invoices and freezes their document when issued", async () => {
    const { clientId } = await setup();
    const { id } = await read(await createItemised(alice, clientId), idBody);

    const noProfile = await request(alice, "POST", `/invoices/${id}/issue`, {
      number: null,
    });

    await request(alice, "PUT", "/business-profile", PROFILE);

    const issued = await request(alice, "POST", `/invoices/${id}/issue`, {
      number: null,
    });

    await request(alice, "PUT", "/business-profile", {
      ...PROFILE,
      name: "Renamed later",
    });

    await expect(read(noProfile, errorBody)).resolves.toMatchObject({
      error: { code: "finances.profile_incomplete" },
    });
    expect(issued.status).toBe(200);
    await expect(
      read(
        await request(alice, "GET", `/invoices/${id}/document`),
        documentBody
      )
    ).resolves.toStrictEqual({
      document: {
        client: { name: "Northwind Labs" },
        issuer: { name: "Jane Dev" },
        lines: [
          { amountMinor: 320_000, unit: "hrs" },
          { amountMinor: 2500, unit: null },
        ],
        number: "2020-002",
        totals: { totalMinor: 322_500 },
      },
    });
  });

  it("keeps documents and generated PDFs inside the household", async () => {
    const { clientId } = await setup();
    const { id } = await read(await createItemised(alice, clientId), idBody);

    const storeGenerated = async (session: Session, householdId: string) =>
      await app.request(
        `${ORIGIN}/api/photos`,
        {
          body: JSON.stringify({
            contentType: "application/pdf",
            fileName: "Invoice-2020-001.pdf",
            generated: true,
            objectKey: `${householdId}/finance_invoice/${id}/${crypto.randomUUID()}.pdf`,
            ownerId: id,
            ownerType: "finance_invoice",
            sizeBytes: 1000,
          }),
          headers: {
            "content-type": "application/json",
            cookie: session.cookie,
            origin: ORIGIN,
          },
          method: "POST",
        },
        env
      );

    const bobDocument = await request(bob, "GET", `/invoices/${id}/document`);
    const onDraft = await storeGenerated(alice, alice.householdId);

    await request(alice, "PUT", "/business-profile", PROFILE);
    await request(alice, "POST", `/invoices/${id}/issue`, { number: null });

    const bobStores = await storeGenerated(bob, bob.householdId);
    const stored = await storeGenerated(alice, alice.householdId);
    const second = await storeGenerated(alice, alice.householdId);
    const { id: photoId } = await read(stored, idBody);

    const removed = await app.request(
      `${ORIGIN}/api/photos/${photoId}`,
      {
        headers: { cookie: alice.cookie, origin: ORIGIN },
        method: "DELETE",
      },
      env
    );

    expect(bobDocument.status).toBe(404);
    expect(bobStores.status).toBe(404);
    // Not on a draft; once issued, one generated PDF that can't be removed.
    expect(
      [onDraft, stored, second, removed].map((r) => r.status)
    ).toStrictEqual([409, 201, 409, 409]);
  });
});
