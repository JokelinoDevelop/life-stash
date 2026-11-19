import { isNotNull } from "drizzle-orm";

import { Container } from "../../core/container";
import { createDb } from "../../core/db";
import type { Db } from "../../core/db";
import type { Bindings } from "../../core/env";
import { financeInvoices, financeTransactions } from "../../db/schema/finances";
import { UNDO_WINDOW_DAYS } from "./transactions/transactions.service";

const MS_PER_DAY = 86_400_000;

/** One overdue heads-up per newly overdue invoice, for every household that wants them. */
const sendOverdueReminders = async (env: Bindings, db: Db): Promise<void> => {
  const rows = await db
    .selectDistinct({ householdId: financeInvoices.householdId })
    .from(financeInvoices);

  await Promise.all(
    rows.map(async ({ householdId }) => {
      const pending: Promise<unknown>[] = [];

      const defer = (work: Promise<unknown>) => {
        pending.push(work);
      };

      try {
        await new Container({
          db,
          defer,
          env,
          householdId,
        }).finances.overdueReminders.run();
      } catch (error) {
        console.error("Overdue reminders failed", householdId, error);
      }

      await Promise.allSettled(pending);
    })
  );
};

/**
 * Daily: overdue-invoice heads-ups, then purges soft-deleted finance records (and their files)
 * once the undo window has passed.
 */
export const runFinancesSweep = async (env: Bindings): Promise<void> => {
  const db = createDb(env.DB);
  await sendOverdueReminders(env, db);

  const cutoff = new Date(
    Date.now() - UNDO_WINDOW_DAYS * MS_PER_DAY
  ).toISOString();

  const [fromTransactions, fromInvoices] = await Promise.all([
    db
      .selectDistinct({ householdId: financeTransactions.householdId })
      .from(financeTransactions)
      .where(isNotNull(financeTransactions.deletedAt)),
    db
      .selectDistinct({ householdId: financeInvoices.householdId })
      .from(financeInvoices)
      .where(isNotNull(financeInvoices.deletedAt)),
  ]);

  const households = new Set(
    [...fromTransactions, ...fromInvoices].map((row) => row.householdId)
  );

  await Promise.all(
    [...households].map(async (householdId) => {
      const pending: Promise<unknown>[] = [];

      const defer = (work: Promise<unknown>) => {
        pending.push(work);
      };

      const { finances } = new Container({ db, defer, env, householdId });

      try {
        // Entries first: an invoice's ledger entry references it. Their files go right away,
        // so a failing invoice purge can't leave them orphaned in the bucket.
        const transactionIds = await finances.transactions.purgeExpired();
        await finances.deleteFiles("finance_transaction", transactionIds);
        // oxlint-disable-next-line react-doctor/server-sequential-independent-await -- must run after the entries are gone (foreign key)
        const invoiceIds = await finances.invoices.purgeExpired(cutoff);
        await finances.deleteFiles("finance_invoice", invoiceIds);
      } catch (error) {
        console.error("Finance purge failed", householdId, error);
      }

      await Promise.allSettled(pending);
    })
  );
};
