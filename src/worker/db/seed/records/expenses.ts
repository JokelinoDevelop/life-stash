import type { ExpenseCategory } from "@shared/domain/garage-kinds";
import type { Currency } from "@shared/domain/money";
import { toMinor } from "@shared/domain/money";

import type { garageExpenses } from "../../schema/garage";
import type { SeedContext, SeededCar } from "../context";

export type ExpenseRow = typeof garageExpenses.$inferInsert;

const MILLI_PER_UNIT = 1000;

export interface ExpenseSpec {
  car: SeededCar;
  category: ExpenseCategory;
  date: string;
  /** Major units. */
  amount: number;
  currency?: Currency;
  odometerKm?: number | null;
  /** E.g. litres of fuel. */
  quantity?: number;
  notes?: string;
}

export const buildExpense = (
  ctx: SeedContext,
  spec: ExpenseSpec
): ExpenseRow => ({
  amountMinor: toMinor(spec.amount),
  carId: spec.car.id,
  category: spec.category,
  currency: spec.currency ?? spec.car.fixture.currency,
  date: spec.date,
  householdId: ctx.householdId,
  id: crypto.randomUUID(),
  notes: spec.notes ?? null,
  odometerKm: spec.odometerKm ?? null,
  quantityMilli:
    spec.quantity === undefined
      ? null
      : Math.round(spec.quantity * MILLI_PER_UNIT),
});
