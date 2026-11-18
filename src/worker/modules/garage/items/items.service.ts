import { and, eq, inArray, sql } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { badRequest, notFound } from "../../../core/errors";
import { garageItems, garagePackages } from "../../../db/schema/garage";

export const findItem = async (db: Db, householdId: string, itemId: string) => {
  const [item] = await db
    .select()
    .from(garageItems)
    .where(
      and(eq(garageItems.id, itemId), eq(garageItems.householdId, householdId))
    )
    .limit(1);

  if (!item) {
    throw notFound();
  }

  return item;
};

export const findPackage = async (
  db: Db,
  householdId: string,
  packageId: string
) => {
  const [pkg] = await db
    .select()
    .from(garagePackages)
    .where(
      and(
        eq(garagePackages.id, packageId),
        eq(garagePackages.householdId, householdId)
      )
    )
    .limit(1);

  if (!pkg) {
    throw notFound();
  }

  return pkg;
};

/** Throws 400 unless every id is a catalog item of the household. */
export const assertItemsOwned = async (
  db: Db,
  householdId: string,
  itemIds: string[]
) => {
  const unique = [...new Set(itemIds)];

  if (unique.length === 0) {
    return;
  }

  const rows = await db
    .select({ id: garageItems.id })
    .from(garageItems)
    .where(
      and(
        eq(garageItems.householdId, householdId),
        inArray(garageItems.id, unique)
      )
    );

  if (rows.length !== unique.length) {
    throw badRequest("Unknown catalog item");
  }
};

/**
 * Resolves labels to catalog item ids, matching names case-insensitively and creating
 * missing items so "when was X last done" works for custom entries too.
 */
export const resolveItemIdsByName = async (
  db: Db,
  householdId: string,
  labels: string[]
): Promise<Map<string, string>> => {
  const keys = [...new Set(labels.map((label) => label.trim().toLowerCase()))];
  const result = new Map<string, string>();

  if (keys.length === 0) {
    return result;
  }

  const existing = await db
    .select({ id: garageItems.id, name: garageItems.name })
    .from(garageItems)
    .where(
      and(
        eq(garageItems.householdId, householdId),
        inArray(sql`lower(${garageItems.name})`, keys)
      )
    );

  for (const row of existing) {
    result.set(row.name.toLowerCase(), row.id);
  }

  const missing = labels.filter(
    (label) => !result.has(label.trim().toLowerCase())
  );

  const toCreate = [
    ...new Map(
      missing.map((label) => [label.trim().toLowerCase(), label.trim()])
    ).entries(),
  ];

  if (toCreate.length > 0) {
    const rows = toCreate.map(([key, name]) => ({
      id: crypto.randomUUID(),
      householdId,
      key,
      name,
    }));

    await db
      .insert(garageItems)
      .values(rows.map(({ id, name }) => ({ householdId, id, name })));

    for (const row of rows) {
      result.set(row.key, row.id);
    }
  }

  return result;
};
