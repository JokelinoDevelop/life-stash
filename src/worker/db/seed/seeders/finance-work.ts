import { addDays, addMonths } from "@shared/domain/dates";
import { and, eq, like } from "drizzle-orm";

import {
  financeClients,
  financeInvoices,
  financeTransactions,
} from "../../schema/finances";
import type { SeedContext } from "../context";
import { insertRows } from "../insert-rows";
import type { Seeder } from "../seeder";
import { invoiceNumberer, toInvoiceRow } from "./finance-invoice-rows";
import type { PlannedInvoice } from "./finance-invoice-rows";

type InvoiceRow = typeof financeInvoices.$inferInsert;

type TransactionRow = typeof financeTransactions.$inferInsert;

const monthStart = (date: string) => `${date.slice(0, 7)}-01`;
const monthEnd = (date: string) => addDays(addMonths(monthStart(date), 1), -1);

interface ClientIds {
  acme: string;
  brightside: string;
  northwind: string;
  polaris: string;
}

const seedClients = async (
  ctx: SeedContext,
  ids: ClientIds,
  lastYear: number
) => {
  await insertRows(ctx.db, financeClients, [
    {
      createdAt: `${lastYear - 1}-03-04T09:00:00.000Z`,
      currency: "EUR",
      email: "billing@northwind.example",
      householdId: ctx.householdId,
      id: ids.northwind,
      kind: "client",
      name: "Northwind Labs",
      notes:
        "Invoice on the last working day. Reference the PO number from the contract.",
      paymentTermsDays: 30,
    },
    {
      currency: "EUR",
      email: "studio@brightside.example",
      householdId: ctx.householdId,
      id: ids.brightside,
      kind: "client",
      name: "Brightside Studio",
      notes: "Design & web projects, billed per milestone.",
      paymentTermsDays: 14,
    },
    {
      currency: "MKD",
      email: null,
      householdId: ctx.householdId,
      id: ids.acme,
      kind: "employer",
      name: "ACME d.o.o.",
      notes: "Salary on the 25th.",
      paymentTermsDays: 0,
    },
    {
      archivedAt: `${lastYear}-12-20T09:00:00.000Z`,
      currency: "EUR",
      email: null,
      householdId: ctx.householdId,
      id: ids.polaris,
      kind: "client",
      name: "Polaris Agency",
      notes: `Last worked together in ${String(lastYear)}.`,
      paymentTermsDays: 30,
    },
  ]);
};

/** A monthly Northwind retainer, Brightside milestones and last year's Polaris jobs. */
const planInvoices = (
  ctx: SeedContext,
  ids: ClientIds,
  lastYear: number
): PlannedInvoice[] => {
  const planned: PlannedInvoice[] = [];
  const thisMonth = monthStart(ctx.today);

  // Northwind: a monthly retainer for the last 12 months; last month sent, this month draft.
  for (let back = 12; back >= 0; back -= 1) {
    const period = addMonths(thisMonth, -back);
    const paidAfter = back >= 2 ? ctx.random.int(22, 29) : null;

    planned.push({
      amount: 4800,
      clientId: ids.northwind,
      currency: "EUR",
      description: "Software development",
      draft: back === 0,
      issueDate: monthEnd(period),
      paidAfterDays: paidAfter,
      periodEnd: monthEnd(period),
      periodStart: period,
      termsDays: 30,
    });
  }

  planned.push(
    {
      amount: 1600,
      clientId: ids.brightside,
      currency: "EUR",
      description: "Brand guidelines",
      issueDate: addDays(ctx.today, -132),
      paidAfterDays: 8,
      periodEnd: null,
      periodStart: null,
      termsDays: 14,
    },
    {
      amount: 2400,
      clientId: ids.brightside,
      currency: "EUR",
      description: "Website rebuild · milestone 1",
      issueDate: addDays(ctx.today, -65),
      paidAfterDays: 27,
      periodEnd: null,
      periodStart: null,
      termsDays: 14,
    },
    {
      amount: 3200,
      clientId: ids.brightside,
      currency: "EUR",
      description: "Website rebuild · milestone 2",
      issueDate: addDays(ctx.today, -28),
      paidAfterDays: null,
      periodEnd: null,
      periodStart: null,
      termsDays: 14,
    },
    {
      amount: 2900,
      clientId: ids.polaris,
      currency: "EUR",
      description: "Campaign landing pages",
      issueDate: `${lastYear}-06-12`,
      paidAfterDays: 31,
      periodEnd: null,
      periodStart: null,
      termsDays: 30,
    },
    {
      amount: 1850,
      clientId: ids.polaris,
      currency: "EUR",
      description: "Newsletter templates",
      issueDate: `${lastYear}-12-05`,
      paidAfterDays: 12,
      periodEnd: null,
      periodStart: null,
      termsDays: 30,
    }
  );

  return planned;
};

/** The ledger seeder booked salary and small freelance jobs without a client: link them. */
const linkLedgerToClients = async (ctx: SeedContext, ids: ClientIds) => {
  await ctx.db
    .update(financeTransactions)
    .set({ clientId: ids.acme })
    .where(
      and(
        eq(financeTransactions.householdId, ctx.householdId),
        like(financeTransactions.description, "Salary%")
      )
    );
  await ctx.db
    .update(financeTransactions)
    .set({ clientId: ids.brightside })
    .where(
      and(
        eq(financeTransactions.householdId, ctx.householdId),
        eq(
          financeTransactions.categoryId,
          ctx.finance.categoryIds.get("Freelance") ?? ""
        )
      )
    );
};

/** Clients (the canvas cast) and their invoices; paid ones book income in "Invoices". */
export const financeWorkSeeder: Seeder = {
  name: "invoices",
  run: async (ctx: SeedContext) => {
    const ids = {
      acme: crypto.randomUUID(),
      brightside: crypto.randomUUID(),
      northwind: crypto.randomUUID(),
      polaris: crypto.randomUUID(),
    };

    const lastYear = Number(ctx.today.slice(0, 4)) - 1;

    ctx.finance.clientIds = new Map([
      ["ACME d.o.o.", ids.acme],
      ["Brightside Studio", ids.brightside],
      ["Northwind Labs", ids.northwind],
      ["Polaris Agency", ids.polaris],
    ]);

    await seedClients(ctx, ids, lastYear);

    const planned = planInvoices(ctx, ids, lastYear);

    const invoices: InvoiceRow[] = [];
    const income: TransactionRow[] = [];
    const invoicesCategory = ctx.finance.categoryIds.get("Invoices");

    if (invoicesCategory === undefined) {
      throw new Error(
        "Run the ledger seeder first (it creates the categories)."
      );
    }

    const numberFor = invoiceNumberer();

    for (const plan of planned.toSorted((a, b) =>
      a.issueDate.localeCompare(b.issueDate)
    )) {
      const { invoice, payment } = toInvoiceRow(ctx, plan, numberFor(plan));
      invoices.push(invoice);

      if (payment !== null) {
        income.push({ ...payment, categoryId: invoicesCategory });
      }
    }

    await insertRows(ctx.db, financeInvoices, invoices);
    await insertRows(ctx.db, financeTransactions, income);

    await linkLedgerToClients(ctx, ids);

    return { clients: 4, income: income.length, invoices: invoices.length };
  },
};
