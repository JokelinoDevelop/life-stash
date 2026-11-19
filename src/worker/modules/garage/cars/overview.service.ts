import { distancePerYear } from "@shared/domain/mileage";
import { sumByCurrency } from "@shared/domain/money";
import { effectiveVisitTotal } from "@shared/domain/spending";
import { and, desc, eq, gte, inArray } from "drizzle-orm";

import type { Db } from "../../../core/db";
import {
  garageExpenses,
  garageServiceVisitItems,
  garageServiceVisits,
} from "../../../db/schema/garage";
import { odometerPointsForCar } from "../odometer";
import { activeReminders } from "../reminders/evaluate";
import type { CarOverviewResponse } from "./dto/car-overview.response";

const RECENT_VISITS = 5;
const DUE_REMINDERS = 5;

const loadVisits = async (db: Db, householdId: string, carId: string) => {
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

  return visits.map((visit) => ({
    items: items.filter((item) => item.visitId === visit.id),
    visit,
  }));
};

export const carOverview = async (
  db: Db,
  householdId: string,
  carId: string
): Promise<CarOverviewResponse> => {
  const [active, visits, points] = await Promise.all([
    activeReminders(db, householdId, carId),
    loadVisits(db, householdId, carId),
    odometerPointsForCar(db, householdId, carId),
  ]);

  const yearStart = `${active.today.slice(0, 4)}-01-01`;

  const expenses = await db
    .select()
    .from(garageExpenses)
    .where(
      and(
        eq(garageExpenses.householdId, householdId),
        eq(garageExpenses.carId, carId),
        gte(garageExpenses.date, yearStart)
      )
    );

  const year = Number(active.today.slice(0, 4));
  const odometer = active.odometers.get(carId);

  const thisYearVisits = visits.filter(
    ({ visit }) => visit.date >= yearStart && !visit.byPreviousOwner
  );

  return {
    dueReminders: active.reminders
      .slice(0, DUE_REMINDERS)
      .map(({ evaluation, reminder }) => ({
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
      })),
    expensesThisYear: sumByCurrency(expenses),
    kmThisYear:
      distancePerYear(points).find((entry) => entry.year === year)?.km ?? 0,
    latestOdometer: odometer
      ? { date: odometer.lastLoggedOn, km: odometer.latestKm }
      : null,
    maintenanceThisYear: sumByCurrency(
      thisYearVisits.map(({ items, visit }) => ({
        amountMinor:
          effectiveVisitTotal({
            ...visit,
            itemCostsMinor: items.map((item) => item.costMinor),
          }) ?? 0,
        currency: visit.currency,
      }))
    ),
    recentVisits: visits.slice(0, RECENT_VISITS).map(({ items, visit }) => ({
      byPreviousOwner: visit.byPreviousOwner,
      date: visit.date,
      datePrecision: visit.datePrecision,
      id: visit.id,
      items: items
        .toSorted((a, b) => a.position - b.position)
        .map((item) => item.label),
      kind: visit.kind,
      odometerKm: visit.odometerKm,
    })),
    today: active.today,
  };
};
