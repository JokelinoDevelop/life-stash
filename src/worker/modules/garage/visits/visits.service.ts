import { effectiveVisitTotal } from "@shared/domain/spending";
import { and, count, desc, eq, inArray } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { conflict, notFound } from "../../../core/errors";
import { photos } from "../../../db/schema/core";
import {
  garageServiceVisitItems,
  garageServiceVisits,
} from "../../../db/schema/garage";
import type { CarRow } from "../cars/cars.service";
import { assertItemsOwned, resolveItemIdsByName } from "../items/items.service";

export type VisitRow = typeof garageServiceVisits.$inferSelect;

export type VisitItemRow = typeof garageServiceVisitItems.$inferSelect;

export interface VisitWithItems {
  visit: VisitRow;
  items: VisitItemRow[];
  effectiveTotalMinor: number | null;
}

export interface VisitItemInput {
  itemId: string | null;
  label: string;
  costMinor: number | null;
}

/** Archived cars are read-only. */
export const assertWritableCar = (car: CarRow): void => {
  if (car.archivedAt !== null) {
    throw conflict("This car is archived");
  }
};

export const findVisit = async (
  db: Db,
  householdId: string,
  visitId: string
): Promise<VisitRow> => {
  const [visit] = await db
    .select()
    .from(garageServiceVisits)
    .where(
      and(
        eq(garageServiceVisits.id, visitId),
        eq(garageServiceVisits.householdId, householdId)
      )
    )
    .limit(1);

  if (!visit) {
    throw notFound();
  }

  return visit;
};

const withItems = async (
  db: Db,
  visits: VisitRow[]
): Promise<VisitWithItems[]> => {
  const items =
    visits.length === 0
      ? []
      : await db
          .select()
          .from(garageServiceVisitItems)
          .where(
            inArray(
              garageServiceVisitItems.visitId,
              visits.map((visit) => visit.id)
            )
          );

  const byVisit = new Map<string, VisitItemRow[]>();

  for (const item of items) {
    byVisit.set(item.visitId, [...(byVisit.get(item.visitId) ?? []), item]);
  }

  return visits.map((visit) => {
    const visitItems = (byVisit.get(visit.id) ?? []).toSorted(
      (a, b) => a.position - b.position
    );

    return {
      effectiveTotalMinor: effectiveVisitTotal({
        ...visit,
        itemCostsMinor: visitItems.map((item) => item.costMinor),
      }),
      items: visitItems,
      visit,
    };
  });
};

export const visitsOfCar = async (
  db: Db,
  householdId: string,
  carId: string
) => {
  const visits = await db
    .select()
    .from(garageServiceVisits)
    .where(
      and(
        eq(garageServiceVisits.householdId, householdId),
        eq(garageServiceVisits.carId, carId)
      )
    )
    .orderBy(
      desc(garageServiceVisits.date),
      desc(garageServiceVisits.createdAt)
    );

  return await withItems(db, visits);
};

export const visitWithItems = async (
  db: Db,
  visit: VisitRow
): Promise<VisitWithItems> => {
  const [result] = await withItems(db, [visit]);

  if (!result) {
    throw notFound();
  }

  return result;
};

export const photoCounts = async (
  db: Db,
  householdId: string,
  visitIds: string[]
): Promise<Map<string, number>> => {
  if (visitIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({ ownerId: photos.ownerId, value: count() })
    .from(photos)
    .where(
      and(
        eq(photos.householdId, householdId),
        eq(photos.ownerType, "service_visit"),
        inArray(photos.ownerId, visitIds)
      )
    )
    .groupBy(photos.ownerId);

  return new Map(rows.map((row) => [row.ownerId, row.value]));
};

/** Validates linked catalog items and links custom labels to (possibly new) catalog items. */
export const prepareVisitItems = async (
  db: Db,
  householdId: string,
  items: VisitItemInput[]
): Promise<(VisitItemInput & { itemId: string; position: number })[]> => {
  const linkedIds = items.flatMap((item) =>
    item.itemId === null ? [] : [item.itemId]
  );

  await assertItemsOwned(db, householdId, linkedIds);

  const customLabels = items.flatMap((item) =>
    item.itemId === null ? [item.label] : []
  );

  const resolved = await resolveItemIdsByName(db, householdId, customLabels);

  return items.map((item, position) => ({
    ...item,
    itemId: item.itemId ?? resolved.get(item.label.trim().toLowerCase()) ?? "",
    label: item.label.trim(),
    position,
  }));
};
