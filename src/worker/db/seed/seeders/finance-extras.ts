import { addMonths } from "@shared/domain/dates";
import { toMinor } from "@shared/domain/money";
import { and, eq, like } from "drizzle-orm";

import {
  financeInvoices,
  financeProjects,
  financeRecurring,
  financeTransactions,
} from "../../schema/finances";
import type { SeedContext } from "../context";
import { LEDGER_SALARY } from "../fixtures/finances";
import type { Seeder } from "../seeder";

const idOf = (ids: Map<string, string>, name: string): string => {
  const found = ids.get(name);

  if (found === undefined) {
    throw new Error(
      `Unknown "${name}". Run the ledger and invoices seeders first.`
    );
  }

  return found;
};

/** The salary as a recurring template (this month still to confirm) and one project. */
export const financeExtrasSeeder: Seeder = {
  name: "recurring",
  run: async (ctx: SeedContext) => {
    const recurringId = crypto.randomUUID();
    const projectId = crypto.randomUUID();
    const acme = idOf(ctx.finance.clientIds, "ACME d.o.o.");
    const brightside = idOf(ctx.finance.clientIds, "Brightside Studio");
    const lastMonth = addMonths(`${ctx.today.slice(0, 7)}-01`, -1).slice(0, 7);
    const salaryBooked = Number(ctx.today.slice(8, 10)) >= LEDGER_SALARY.day;

    await ctx.db.insert(financeRecurring).values({
      amountMinor: toMinor(LEDGER_SALARY.amount),
      categoryId: idOf(ctx.finance.categoryIds, "Salary"),
      clientId: acme,
      currency: LEDGER_SALARY.currency,
      dayOfMonth: LEDGER_SALARY.day,
      description: "Salary",
      householdId: ctx.householdId,
      id: recurringId,
      kind: "income",
      // When this month's salary is already in the ledger, it was confirmed; otherwise it waits.
      lastHandledMonth: salaryBooked ? ctx.today.slice(0, 7) : lastMonth,
    });

    await ctx.db
      .update(financeTransactions)
      .set({ recurringId })
      .where(
        and(
          eq(financeTransactions.householdId, ctx.householdId),
          like(financeTransactions.description, "Salary%")
        )
      );

    await ctx.db.insert(financeProjects).values({
      clientId: brightside,
      householdId: ctx.householdId,
      id: projectId,
      name: "Website rebuild",
      notes: "Two milestones, design system included.",
    });

    await ctx.db
      .update(financeInvoices)
      .set({ projectId })
      .where(
        and(
          eq(financeInvoices.householdId, ctx.householdId),
          like(financeInvoices.description, "Website rebuild%")
        )
      );

    return { projects: 1, recurring: 1 };
  },
};
