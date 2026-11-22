import { addDays, addMonths } from "@shared/domain/dates";
import {
  invoiceTotals,
  lineAmounts,
} from "@shared/domain/finances/invoice-document";
import type {
  InvoiceClientSnapshot,
  InvoiceIssuerSnapshot,
} from "@shared/domain/finances/invoice-document";
import {
  formatInvoiceNumber,
  nextInvoiceSeq,
} from "@shared/domain/finances/invoices";
import { and, eq, isNull } from "drizzle-orm";

import {
  financeBusinessProfile,
  financeClients,
  financeInvoiceLines,
  financeInvoices,
} from "../../schema/finances";
import type { SeedContext } from "../context";
import { insertRows } from "../insert-rows";
import type { Seeder } from "../seeder";

/** The demo's own details, printed on every itemised invoice. */
const ISSUER: InvoiceIssuerSnapshot = {
  address: "Ulica Makedonija 12\n1000 Skopje\nNorth Macedonia",
  bankAddress: "Orce Nikolov 3, 1000 Skopje",
  bankCountry: "North Macedonia",
  bankName: "Komercijalna banka AD Skopje",
  companyId: "7712345",
  email: "hello@demo-dev.example",
  footerNote: "Not a VAT payer.",
  iban: "MK07 3000 0000 0042 425",
  name: "Demo Dev DOOEL",
  phone: "+389 70 123 456",
  swift: "KOBSMK2X",
  taxId: "4030012345678",
  vatRegistered: false,
};

/** Billing details for the invoiced clients (the employer has none). */
const CLIENT_BILLING = {
  "Brightside Studio": {
    address: "Kej 13 Noemvri 4\n1000 Skopje",
    invoiceLanguage: "mk",
    taxId: "4030998877665",
  },
  "Northwind Labs": {
    address: "Torstraße 140\n10119 Berlin\nGermany",
    invoiceLanguage: "en",
    taxId: "DE312345678",
  },
  "Polaris Agency": {
    address: "Strandvejen 70\n2900 Hellerup\nDenmark",
    invoiceLanguage: "en",
    taxId: "DK12345678",
  },
} as const;

interface PlannedLine {
  description: string;
  quantityMilli: number;
  unit: string | null;
  unitPriceMinor: number;
}

/** Prices each line and the invoice total like the service does (no VAT: not registered). */
const priced = (lines: readonly PlannedLine[]) => {
  const rows = lines.map((line) => ({
    ...line,
    ...lineAmounts({ ...line, vatRateBp: 0 }),
    vatRateBp: 0,
  }));

  return { rows, total: invoiceTotals(rows).totalMinor };
};

const monthName = (date: string): string =>
  new Date(`${date}T12:00:00Z`).toLocaleString("en-GB", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  });

const requireClient = (ctx: SeedContext, name: string): string => {
  const id = ctx.finance.clientIds.get(name);

  if (id === undefined) {
    throw new Error("Run the invoices seeder first (it creates the clients).");
  }

  return id;
};

/** The next free sequence of `year`, so the issued demo invoice continues the book. */
const nextSeq = async (ctx: SeedContext, year: number): Promise<number> => {
  const rows = await ctx.db
    .select({ seq: financeInvoices.numberSeq })
    .from(financeInvoices)
    .where(
      and(
        eq(financeInvoices.householdId, ctx.householdId),
        eq(financeInvoices.numberYear, year)
      )
    );

  return nextInvoiceSeq(
    rows.flatMap((row) => (row.seq === null ? [] : [row.seq]))
  );
};

/**
 * Turns this month's Northwind retainer draft into an itemised draft (a monthly fee), so the
 * editor opens with lines and a preview.
 */
const itemiseRetainerDraft = async (ctx: SeedContext): Promise<number> => {
  const northwind = requireClient(ctx, "Northwind Labs");

  const [draft] = await ctx.db
    .select({
      id: financeInvoices.id,
      periodStart: financeInvoices.periodStart,
    })
    .from(financeInvoices)
    .where(
      and(
        eq(financeInvoices.householdId, ctx.householdId),
        eq(financeInvoices.clientId, northwind),
        eq(financeInvoices.status, "draft"),
        isNull(financeInvoices.deletedAt)
      )
    )
    .limit(1);

  if (draft === undefined) {
    return 0;
  }

  const month = monthName(draft.periodStart ?? ctx.today);

  const { rows, total } = priced([
    {
      description: `Software development — ${month}`,
      quantityMilli: 1000,
      unit: null,
      unitPriceMinor: 470_000,
    },
    {
      description: "Hosting and monitoring",
      quantityMilli: 1000,
      unit: null,
      unitPriceMinor: 10_000,
    },
  ]);

  await ctx.db
    .update(financeInvoices)
    .set({ amountMinor: total, description: "Thank you for your business." })
    .where(eq(financeInvoices.id, draft.id));

  await insertRows(
    ctx.db,
    financeInvoiceLines,
    rows.map((line, position) => ({
      ...line,
      householdId: ctx.householdId,
      invoiceId: draft.id,
      position,
    }))
  );

  return 1;
};

/** An hourly Brightside invoice, issued ten days ago with its details frozen (in Macedonian). */
const issueHourlyInvoice = async (ctx: SeedContext): Promise<number> => {
  const brightside = requireClient(ctx, "Brightside Studio");
  const issueDate = addDays(ctx.today, -10);
  const year = Number(issueDate.slice(0, 4));
  const seq = await nextSeq(ctx, year);

  const { rows, total } = priced([
    {
      description: "Дизајн и front-end — нова почетна страница",
      quantityMilli: 24_500,
      unit: "ч.",
      unitPriceMinor: 5500,
    },
    {
      description: "Фотографии од банка на слики",
      quantityMilli: 3000,
      unit: "пар.",
      unitPriceMinor: 1200,
    },
  ]);

  const billing = CLIENT_BILLING["Brightside Studio"];

  const client: InvoiceClientSnapshot = {
    address: billing.address,
    email: "studio@brightside.example",
    language: billing.invoiceLanguage,
    name: "Brightside Studio",
    taxId: billing.taxId,
  };

  const id = crypto.randomUUID();

  await insertRows(ctx.db, financeInvoices, [
    // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
    {
      amountMinor: total,
      clientId: brightside,
      clientSnapshot: client,
      createdAt: `${addDays(issueDate, -1)}T15:00:00.000Z`,
      currency: "EUR",
      description: "Ви благодариме за соработката.",
      dueDate: addDays(issueDate, 14),
      householdId: ctx.householdId,
      id,
      issueDate,
      issuedAt: `${issueDate}T09:30:00.000Z`,
      issuerSnapshot: ISSUER,
      number: formatInvoiceNumber(year, seq),
      numberSeq: seq,
      numberYear: year,
      periodEnd: addDays(addMonths(`${issueDate.slice(0, 7)}-01`, 1), -1),
      periodStart: `${issueDate.slice(0, 7)}-01`,
      purchaseOrder: "PO-2041",
      sentAt: issueDate,
      status: "sent",
    },
  ]);

  await insertRows(
    ctx.db,
    financeInvoiceLines,
    rows.map((line, position) => ({
      ...line,
      householdId: ctx.householdId,
      invoiceId: id,
      position,
    }))
  );

  return 1;
};

/** F4: your details, client billing details and two itemised invoices (monthly and hourly). */
export const financeDocumentsSeeder: Seeder = {
  name: "invoice docs",
  run: async (ctx: SeedContext) => {
    const { vatRegistered, ...profile } = ISSUER;

    await ctx.db.insert(financeBusinessProfile).values({
      ...profile,
      defaultVatRateBp: 0,
      householdId: ctx.householdId,
      vatRegistered,
    });

    await Promise.all(
      Object.entries(CLIENT_BILLING).map(async ([name, billing]) => {
        await ctx.db
          .update(financeClients)
          .set(billing)
          .where(
            and(
              eq(financeClients.householdId, ctx.householdId),
              eq(financeClients.id, requireClient(ctx, name))
            )
          );
      })
    );

    const itemised =
      (await itemiseRetainerDraft(ctx)) + (await issueHourlyInvoice(ctx));

    return { itemised, profile: 1 };
  },
};
