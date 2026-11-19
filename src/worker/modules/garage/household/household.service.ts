import { distancePerYear } from "@shared/domain/mileage";
import {
  spendingByMonth,
  spendingByYear,
} from "@shared/domain/spending-report";
import type { YearSpending } from "@shared/domain/spending-report";
import { and, eq, isNull } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { households } from "../../../db/schema/core";
import { garageCars } from "../../../db/schema/garage";
import { odometerPointsForCar } from "../odometer";
import { activeReminders } from "../reminders/evaluate";
import { loadSources } from "../spending/spending.service";
import type { HouseholdOverviewResponse } from "./dto/household-overview.response";

const yearTotals = (years: YearSpending[], year: number) =>
  years.flatMap((entry) => {
    const amountMinor =
      entry.maintenanceMinor + entry.repairMinor + entry.otherMinor;

    return entry.year === year && amountMinor > 0
      ? [{ amountMinor, currency: entry.currency }]
      : [];
  });

/** Everything the household Garage home needs in one round trip. */
export const householdOverview = async (
  db: Db,
  householdId: string
): Promise<HouseholdOverviewResponse> => {
  const [household, cars, active, sources] = await Promise.all([
    db
      .select({ name: households.name })
      .from(households)
      .where(eq(households.id, householdId))
      .limit(1),
    db
      .select({ id: garageCars.id })
      .from(garageCars)
      .where(
        and(
          eq(garageCars.householdId, householdId),
          isNull(garageCars.archivedAt)
        )
      ),
    activeReminders(db, householdId),
    loadSources(db, householdId, null),
  ]);

  const activeIds = new Set(cars.map((car) => car.id));
  const year = Number(active.today.slice(0, 4));

  const points = await Promise.all(
    cars.map(async (car) => await odometerPointsForCar(db, householdId, car.id))
  );

  const kmThisYear = points.reduce(
    (sum, carPoints) =>
      sum +
      (distancePerYear(carPoints).find((entry) => entry.year === year)?.km ??
        0),
    0
  );

  const years = spendingByYear(sources.visits, sources.expenses);

  const months = cars.flatMap((car) =>
    spendingByMonth(
      sources.visits.filter((visit) => visit.carId === car.id),
      sources.expenses.filter((expense) => expense.carId === car.id),
      year
    ).map((entry) => ({ ...entry, carId: car.id }))
  );

  return {
    kmThisYear,
    months,
    householdName: household[0]?.name ?? "",
    reminders: active.reminders.flatMap(({ evaluation, reminder }) =>
      activeIds.has(reminder.carId)
        ? [
            {
              carId: reminder.carId,
              daysLeft: evaluation.daysLeft,
              dueDate: reminder.dueDate,
              dueOdometerKm: reminder.dueOdometerKm,
              id: reminder.id,
              intervalKm: reminder.intervalKm,
              intervalMonths: reminder.intervalMonths,
              kind: reminder.kind,
              kmLeft: evaluation.kmLeft,
              status: evaluation.status,
              title: reminder.title,
            },
          ]
        : []
    ),
    spentLastYear: yearTotals(years, year - 1),
    spentThisYear: yearTotals(years, year),
    today: active.today,
  };
};
