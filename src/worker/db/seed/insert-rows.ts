import type { SQLiteTable } from "drizzle-orm/sqlite-core";

import type { Db } from "../../core/db";

/** D1 caps bound parameters per statement, so rows go one per statement, batched. */
const STATEMENTS_PER_BATCH = 50;

const chunk = <T>(list: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, index) =>
    list.slice(index * size, (index + 1) * size)
  );

/** Inserts rows of one table in batches and returns how many were written. */
export const insertRows = async <TTable extends SQLiteTable>(
  db: Db,
  table: TTable,
  rows: readonly TTable["$inferInsert"][]
): Promise<number> => {
  await Promise.all(
    chunk(rows, STATEMENTS_PER_BATCH).map(async (batch) => {
      const [first, ...rest] = batch.map((row) => db.insert(table).values(row));

      if (first) {
        await db.batch([first, ...rest]);
      }
    })
  );

  return rows.length;
};
