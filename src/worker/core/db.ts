import { drizzle } from "drizzle-orm/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";

export type Db = DrizzleD1Database;

export const createDb = (d1: D1Database): Db => drizzle(d1);

const UNIQUE_VIOLATION = "UNIQUE constraint failed";

/** Whether a query failed on a unique index (drizzle may wrap the driver error in `cause`). */
export const isUniqueViolation = (error: Error): boolean => {
  let current: unknown = error;

  while (current instanceof Error) {
    if (current.message.includes(UNIQUE_VIOLATION)) {
      return true;
    }

    current = current.cause;
  }

  return false;
};
