import type { ExpenseCategory } from "@shared/domain/garage-kinds";
import { toMajor, toMinor } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import { displayToKm, kmToDisplay } from "@shared/domain/units";
import type { DistanceUnit } from "@shared/domain/units";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull, parseAmount, parseInteger } from "@/lib/form-schemas";

import type { ExpenseDetail } from "../expenses.queries";
import type { ExpenseFormValues } from "./schema";

type CreateExpenseBody = InferRequestType<
  typeof api.garage.expenses.$post
>["json"];

type UpdateExpenseBody = InferRequestType<
  (typeof api.garage.expenses)[":expenseId"]["$put"]
>["json"];

const MILLI = 1000;

export const expenseFormDefaults = (context: {
  currency: Currency;
  today: string;
  category: ExpenseCategory;
}): ExpenseFormValues => ({
  amount: "",
  category: context.category,
  currency: context.currency,
  date: context.today,
  notes: "",
  odometer: "",
  quantity: "",
});

export const expenseToFormValues = (
  expense: ExpenseDetail,
  unit: DistanceUnit
): ExpenseFormValues => ({
  amount: String(toMajor(expense.amountMinor)),
  category: expense.category,
  currency: expense.currency,
  date: expense.date,
  notes: expense.notes ?? "",
  odometer:
    expense.odometerKm === null
      ? ""
      : String(kmToDisplay(expense.odometerKm, unit)),
  quantity:
    expense.quantityMilli === null ? "" : String(expense.quantityMilli / MILLI),
});

export const expenseFormToUpdateRequest = (
  values: ExpenseFormValues,
  unit: DistanceUnit
): UpdateExpenseBody => {
  const odometer = parseInteger(values.odometer);

  const quantity =
    values.category === "fuel" ? parseAmount(values.quantity) : null;

  return {
    amountMinor: toMinor(parseAmount(values.amount) ?? 0),
    category: values.category,
    currency: values.currency,
    date: values.date,
    notes: emptyToNull(values.notes),
    odometerKm: odometer === null ? null : displayToKm(odometer, unit),
    quantityMilli: quantity === null ? null : Math.round(quantity * MILLI),
  };
};

export const expenseFormToCreateRequest = (
  values: ExpenseFormValues,
  context: { carId: string; unit: DistanceUnit; reminderId: string | null }
): CreateExpenseBody => ({
  ...expenseFormToUpdateRequest(values, context.unit),
  carId: context.carId,
  reminderId: context.reminderId,
});
