import { toMajor, toMinor } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { parseAmount, parseInteger } from "@/lib/form-schemas";

import type { RecurringItem } from "../../recurring.queries";
import type { RecurringFormValues } from "./schema";

type CreateBody = InferRequestType<typeof api.finances.recurring.$post>["json"];

export const NO_CLIENT = "none";

export const recurringFormDefaults = (context: {
  categoryId: string;
  currency: Currency;
}): RecurringFormValues => ({
  active: true,
  amount: "",
  categoryId: context.categoryId,
  clientId: NO_CLIENT,
  currency: context.currency,
  dayOfMonth: "25",
  description: "",
});

export const recurringToFormValues = (
  item: RecurringItem
): RecurringFormValues => ({
  active: item.active,
  amount: toMajor(item.amountMinor).toFixed(item.currency === "MKD" ? 0 : 2),
  categoryId: item.category.id,
  clientId: item.client?.id ?? NO_CLIENT,
  currency: item.currency,
  dayOfMonth: String(item.dayOfMonth),
  description: item.description,
});

/** Recurring entries here are income (salary and the like). */
export const recurringFormToRequest = (
  values: RecurringFormValues
): CreateBody => ({
  active: values.active,
  amountMinor: toMinor(parseAmount(values.amount) ?? 0),
  categoryId: values.categoryId,
  clientId: values.clientId === NO_CLIENT ? null : values.clientId,
  currency: values.currency,
  dayOfMonth: parseInteger(values.dayOfMonth) ?? 1,
  description: values.description.trim(),
  kind: "income",
});
