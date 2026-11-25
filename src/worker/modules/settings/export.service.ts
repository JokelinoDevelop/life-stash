import { toMajor } from "@shared/domain/money";
import { asc, eq, inArray } from "drizzle-orm";

import type { Db } from "../../core/db";
import {
  garageCars,
  garageExpenses,
  garageOdometerReadings,
  garageReminders,
  garageServiceVisitItems,
  garageServiceVisits,
} from "../../db/schema/garage";
import { toCsv } from "./csv";
import type { ExportDataset } from "./dto/export-csv.request";

const money = (minor: number | null) =>
  minor === null ? null : toMajor(minor);

/** Everything the household owns, as plain JSON (photos are referenced by key only). */
export const exportHouseholdJson = async (db: Db, householdId: string) => {
  const [cars, visits, readings, reminders, expenses] = await Promise.all([
    db.select().from(garageCars).where(eq(garageCars.householdId, householdId)),
    db
      .select()
      .from(garageServiceVisits)
      .where(eq(garageServiceVisits.householdId, householdId)),
    db
      .select()
      .from(garageOdometerReadings)
      .where(eq(garageOdometerReadings.householdId, householdId)),
    db
      .select()
      .from(garageReminders)
      .where(eq(garageReminders.householdId, householdId)),
    db
      .select()
      .from(garageExpenses)
      .where(eq(garageExpenses.householdId, householdId)),
  ]);

  const visitIds = visits.map((visit) => visit.id);

  const visitItems =
    visitIds.length === 0
      ? []
      : await db
          .select()
          .from(garageServiceVisitItems)
          .where(inArray(garageServiceVisitItems.visitId, visitIds));

  return {
    exportedAt: new Date().toISOString(),
    garage: {
      cars,
      expenses,
      reminders,
      odometerReadings: readings,
      serviceVisitItems: visitItems,
      serviceVisits: visits,
    },
    version: 1,
  };
};

const carNames = async (db: Db, householdId: string) => {
  const cars = await db
    .select({ id: garageCars.id, name: garageCars.name })
    .from(garageCars)
    .where(eq(garageCars.householdId, householdId));

  return new Map(cars.map((car) => [car.id, car.name]));
};

const serviceHistoryCsv = async (
  db: Db,
  householdId: string,
  names: Map<string, string>
) => {
  const data = await exportHouseholdJson(db, householdId);

  const rows = data.garage.serviceVisits
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .map((visit) => {
      const items = data.garage.serviceVisitItems
        .filter((item) => item.visitId === visit.id)
        .toSorted((a, b) => a.position - b.position);

      return [
        names.get(visit.carId) ?? "",
        visit.date,
        visit.datePrecision,
        visit.kind,
        visit.odometerKm,
        money(visit.totalMinor),
        visit.currency,
        visit.byPreviousOwner ? "previous owner" : "me",
        items.map((item) => item.label).join("; "),
        visit.shop,
        visit.notes,
      ];
    });

  return toCsv(
    [
      "car",
      "date",
      "precision",
      "kind",
      "odometer_km",
      "total",
      "currency",
      "done_by",
      "items",
      "shop",
      "notes",
    ],
    rows
  );
};

export const exportCsv = async (
  db: Db,
  householdId: string,
  dataset: ExportDataset
): Promise<string> => {
  const names = await carNames(db, householdId);

  if (dataset === "service-history") {
    return await serviceHistoryCsv(db, householdId, names);
  }

  if (dataset === "mileage") {
    const rows = await db
      .select()
      .from(garageOdometerReadings)
      .where(eq(garageOdometerReadings.householdId, householdId))
      .orderBy(asc(garageOdometerReadings.date));

    return toCsv(
      ["car", "date", "odometer_km", "notes"],
      rows.map((row) => [
        names.get(row.carId) ?? "",
        row.date,
        row.odometerKm,
        row.notes,
      ])
    );
  }

  if (dataset === "expenses") {
    const rows = await db
      .select()
      .from(garageExpenses)
      .where(eq(garageExpenses.householdId, householdId))
      .orderBy(asc(garageExpenses.date));

    return toCsv(
      [
        "car",
        "date",
        "category",
        "amount",
        "currency",
        "odometer_km",
        "quantity",
        "notes",
      ],
      rows.map((row) => [
        names.get(row.carId) ?? "",
        row.date,
        row.category,
        toMajor(row.amountMinor),
        row.currency,
        row.odometerKm,
        row.quantityMilli === null ? null : row.quantityMilli / 1000,
        row.notes,
      ])
    );
  }

  const rows = await db
    .select()
    .from(garageReminders)
    .where(eq(garageReminders.householdId, householdId))
    .orderBy(asc(garageReminders.createdAt));

  return toCsv(
    [
      "car",
      "title",
      "kind",
      "due_date",
      "due_odometer_km",
      "interval_months",
      "interval_km",
      "completed_at",
    ],
    rows.map((row) => [
      names.get(row.carId) ?? "",
      row.title,
      row.kind,
      row.dueDate,
      row.dueOdometerKm,
      row.intervalMonths,
      row.intervalKm,
      row.completedAt,
    ])
  );
};
