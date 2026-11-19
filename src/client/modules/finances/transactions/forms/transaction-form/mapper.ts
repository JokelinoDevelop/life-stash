import type { TransactionKind } from "@shared/domain/finances/kinds";
import { toMajor, toMinor } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull, parseAmount } from "@/lib/form-schemas";

import type { TransactionDetail } from "../../transactions.queries";
import type { TransactionFormValues } from "./schema";

type CreateBody = InferRequestType<
  typeof api.finances.transactions.$post
>["json"];

type UpdateBody = InferRequestType<
  (typeof api.finances.transactions)[":transactionId"]["$patch"]
>["json"];

export const transactionFormDefaults = (context: {
  kind: TransactionKind;
  currency: Currency;
  today: string;
}): TransactionFormValues => ({
  amount: "",
  categoryId: "",
  currency: context.currency,
  date: context.today,
  description: "",
  kind: context.kind,
  notes: "",
});

export const transactionToFormValues = (
  detail: TransactionDetail
): TransactionFormValues => ({
  amount: String(toMajor(detail.amountMinor)),
  categoryId: detail.categoryId,
  currency: detail.currency,
  date: detail.date,
  description: detail.description,
  kind: detail.kind,
  notes: detail.notes ?? "",
});

/** "Duplicate": the same entry again, dated today. */
export const duplicateToFormValues = (
  detail: TransactionDetail,
  today: string
): TransactionFormValues => ({
  ...transactionToFormValues(detail),
  date: today,
});

export const transactionFormToCreateRequest = (
  values: TransactionFormValues
): CreateBody => ({
  amountMinor: toMinor(parseAmount(values.amount) ?? 0),
  categoryId: values.categoryId,
  currency: values.currency,
  date: values.date,
  description: values.description.trim(),
  kind: values.kind,
  notes: emptyToNull(values.notes),
});

export const transactionFormToUpdateRequest = (
  values: TransactionFormValues
): UpdateBody => transactionFormToCreateRequest(values);

/** API field → form field, for errors the server pins on a field. */
export const TRANSACTION_SERVER_FIELDS = {
  amountMinor: "amount",
  categoryId: "categoryId",
  date: "date",
  description: "description",
} as const satisfies Record<string, keyof TransactionFormValues>;

/** Shape-only defaults for the form's `withForm` sections. */
export const TRANSACTION_FORM_TEMPLATE = transactionFormDefaults({
  currency: "EUR",
  kind: "expense",
  today: "2000-01-01",
});
