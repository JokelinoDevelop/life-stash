import { isNotNull } from "drizzle-orm";

import { Container } from "../../core/container";
import { createDb } from "../../core/db";
import type { Bindings } from "../../core/env";
import { financeTransactions } from "../../db/schema/finances";

/** Daily: purges soft-deleted finance records whose undo window has passed. */
export const runFinancesSweep = async (env: Bindings): Promise<void> => {
  const db = createDb(env.DB);

  const households = await db
    .selectDistinct({ householdId: financeTransactions.householdId })
    .from(financeTransactions)
    .where(isNotNull(financeTransactions.deletedAt));

  await Promise.all(
    households.map(async ({ householdId }) => {
      const pending: Promise<unknown>[] = [];

      const defer = (work: Promise<unknown>) => {
        pending.push(work);
      };

      const container = new Container({ db, defer, env, householdId });

      await container.finances.transactions.purgeExpired();
      await Promise.allSettled(pending);
    })
  );
};
