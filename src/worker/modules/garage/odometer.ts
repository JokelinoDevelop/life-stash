import { and, eq, isNotNull, max } from "drizzle-orm";

import type { Db } from "../../core/db";
import {
  garageCars,
  garageExpenses,
  garageOdometerReadings,
  garageServiceVisits,
} from "../../db/schema/garage";

export interface OdometerSummary {
  latestKm: number;
  lastLoggedOn: string;
}

/** Where an odometer value was recorded; "purchase" is the odometer when the car was bought. */
export type OdometerSource = "reading" | "service" | "expense" | "purchase";

export interface OdometerPointRow {
  id: string;
  date: string;
  odometerKm: number;
  source: OdometerSource;
  notes: string | null;
}

const merge = (
  target: Map<string, OdometerSummary>,
  rows: { carId: string; km: number | null; date: string | null }[]
) => {
  for (const row of rows) {
    if (row.km !== null && row.date !== null) {
      const current = target.get(row.carId);
      target.set(row.carId, {
        lastLoggedOn:
          current && current.lastLoggedOn > row.date
            ? current.lastLoggedOn
            : row.date,
        latestKm: Math.max(current?.latestKm ?? 0, row.km),
      });
    }
  }
};

/**
 * Latest odometer per car across readings, service visits and expenses.
 * `lastLoggedOn` is the most recent date any odometer value was recorded.
 */
export const odometerSummaries = async (
  db: Db,
  householdId: string
): Promise<Map<string, OdometerSummary>> => {
  const [purchases, readings, visits, expenses] = await Promise.all([
    db
      .select({
        carId: garageCars.id,
        date: garageCars.purchaseDate,
        km: garageCars.purchaseOdometerKm,
      })
      .from(garageCars)
      .where(eq(garageCars.householdId, householdId)),
    db
      .select({
        carId: garageOdometerReadings.carId,
        date: max(garageOdometerReadings.date),
        km: max(garageOdometerReadings.odometerKm),
      })
      .from(garageOdometerReadings)
      .where(eq(garageOdometerReadings.householdId, householdId))
      .groupBy(garageOdometerReadings.carId),
    db
      .select({
        carId: garageServiceVisits.carId,
        date: max(garageServiceVisits.date),
        km: max(garageServiceVisits.odometerKm),
      })
      .from(garageServiceVisits)
      .where(
        and(
          eq(garageServiceVisits.householdId, householdId),
          isNotNull(garageServiceVisits.odometerKm)
        )
      )
      .groupBy(garageServiceVisits.carId),
    db
      .select({
        carId: garageExpenses.carId,
        date: max(garageExpenses.date),
        km: max(garageExpenses.odometerKm),
      })
      .from(garageExpenses)
      .where(
        and(
          eq(garageExpenses.householdId, householdId),
          isNotNull(garageExpenses.odometerKm)
        )
      )
      .groupBy(garageExpenses.carId),
  ]);

  const summaries = new Map<string, OdometerSummary>();
  merge(summaries, purchases);
  merge(summaries, readings);
  merge(summaries, visits);
  merge(summaries, expenses);

  return summaries;
};

/** Every odometer value recorded for a car, from any source. */
export const odometerPointsForCar = async (
  db: Db,
  householdId: string,
  carId: string
): Promise<OdometerPointRow[]> => {
  const [cars, readings, visits, expenses] = await Promise.all([
    db
      .select()
      .from(garageCars)
      .where(
        and(eq(garageCars.householdId, householdId), eq(garageCars.id, carId))
      ),
    db
      .select()
      .from(garageOdometerReadings)
      .where(
        and(
          eq(garageOdometerReadings.householdId, householdId),
          eq(garageOdometerReadings.carId, carId)
        )
      ),
    db
      .select()
      .from(garageServiceVisits)
      .where(
        and(
          eq(garageServiceVisits.householdId, householdId),
          eq(garageServiceVisits.carId, carId),
          isNotNull(garageServiceVisits.odometerKm)
        )
      ),
    db
      .select()
      .from(garageExpenses)
      .where(
        and(
          eq(garageExpenses.householdId, householdId),
          eq(garageExpenses.carId, carId),
          isNotNull(garageExpenses.odometerKm)
        )
      ),
  ]);

  const purchase = cars.flatMap((car) =>
    car.purchaseDate === null || car.purchaseOdometerKm === null
      ? []
      : [
          {
            date: car.purchaseDate,
            id: car.id,
            notes: null,
            odometerKm: car.purchaseOdometerKm,
            source: "purchase" as const,
          },
        ]
  );

  return [
    ...purchase,
    ...readings.map((row) => ({ ...row, source: "reading" as const })),
    ...visits.map((row) => ({
      date: row.date,
      id: row.id,
      notes: row.shop,
      odometerKm: row.odometerKm ?? 0,
      source: "service" as const,
    })),
    ...expenses.map((row) => ({
      date: row.date,
      id: row.id,
      notes: row.category,
      odometerKm: row.odometerKm ?? 0,
      source: "expense" as const,
    })),
  ];
};
