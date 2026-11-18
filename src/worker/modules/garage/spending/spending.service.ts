import { spendingByYear } from "@shared/domain/spending-report";
import type {
  ReportExpense,
  ReportVisit,
  YearSpending,
} from "@shared/domain/spending-report";
import { and, eq, inArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import type { Db } from "../../../core/db";
import {
  garageCars,
  garageExpenses,
  garageServiceVisitItems,
  garageServiceVisits,
} from "../../../db/schema/garage";

interface SpendingSource {
  visits: (ReportVisit & { carId: string })[];
  expenses: (ReportExpense & { carId: string })[];
}

const loadSources = async (
  db: Db,
  householdId: string,
  carId: string | null
): Promise<SpendingSource> => {
  const visitFilters: SQL[] = [
    eq(garageServiceVisits.householdId, householdId),
  ];

  const expenseFilters: SQL[] = [eq(garageExpenses.householdId, householdId)];

  if (carId !== null) {
    visitFilters.push(eq(garageServiceVisits.carId, carId));
    expenseFilters.push(eq(garageExpenses.carId, carId));
  }

  const [visits, expenses] = await Promise.all([
    db
      .select()
      .from(garageServiceVisits)
      .where(and(...visitFilters)),
    db
      .select()
      .from(garageExpenses)
      .where(and(...expenseFilters)),
  ]);

  const items =
    visits.length === 0
      ? []
      : await db
          .select({
            costMinor: garageServiceVisitItems.costMinor,
            visitId: garageServiceVisitItems.visitId,
          })
          .from(garageServiceVisitItems)
          .where(
            inArray(
              garageServiceVisitItems.visitId,
              visits.map((visit) => visit.id)
            )
          );

  const costsByVisit = new Map<string, (number | null)[]>();

  for (const item of items) {
    const costs = costsByVisit.get(item.visitId) ?? [];
    costs.push(item.costMinor);
    costsByVisit.set(item.visitId, costs);
  }

  return {
    expenses,
    visits: visits.map((visit) => ({
      ...visit,
      itemCostsMinor: costsByVisit.get(visit.id) ?? [],
    })),
  };
};

export const carSpending = async (
  db: Db,
  householdId: string,
  carId: string
): Promise<YearSpending[]> => {
  const { visits, expenses } = await loadSources(db, householdId, carId);

  return spendingByYear(visits, expenses);
};

export interface CarYearSpending {
  carId: string;
  carName: string;
  archived: boolean;
  years: YearSpending[];
}

/** Spending of every car in the household, per year and currency. */
export const householdSpending = async (
  db: Db,
  householdId: string
): Promise<CarYearSpending[]> => {
  const [cars, sources] = await Promise.all([
    db
      .select({
        archivedAt: garageCars.archivedAt,
        id: garageCars.id,
        name: garageCars.name,
      })
      .from(garageCars)
      .where(eq(garageCars.householdId, householdId)),
    loadSources(db, householdId, null),
  ]);

  return cars.map((car) => ({
    archived: car.archivedAt !== null,
    carId: car.id,
    carName: car.name,
    years: spendingByYear(
      sources.visits.filter((visit) => visit.carId === car.id),
      sources.expenses.filter((expense) => expense.carId === car.id)
    ),
  }));
};
