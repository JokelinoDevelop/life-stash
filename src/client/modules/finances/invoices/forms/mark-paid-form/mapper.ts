import { toMajor, toMinor } from "@shared/domain/money";

import { parseAmount } from "@/lib/form-schemas";

import type { MarkPaidFormValues } from "./schema";

export const markPaidFormDefaults = (
  invoice: { amountMinor: number },
  today: string
): MarkPaidFormValues => ({
  amount: toMajor(invoice.amountMinor).toFixed(2),
  paidDate: today,
});

export interface MarkPaidRequest {
  amountMinor: number;
  paidDate: string;
}

export const markPaidFormToRequest = (
  values: MarkPaidFormValues
): MarkPaidRequest => ({
  amountMinor: toMinor(parseAmount(values.amount) ?? 0),
  paidDate: values.paidDate,
});
