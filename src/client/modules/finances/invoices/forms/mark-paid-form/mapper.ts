import { toMajor, toMinor } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";

import { parseAmount } from "@/lib/form-schemas";

import type { MarkPaidFormValues } from "./schema";

export const markPaidFormDefaults = (
  invoice: { amountMinor: number; currency: Currency },
  today: string
): MarkPaidFormValues => ({
  amount: toMajor(invoice.amountMinor).toFixed(2),
  currency: invoice.currency,
  paidDate: today,
});

/**
 * The amount field after the received currency changes: the invoice amount only means
 * something in the invoice currency, so switching away clears it (and switching back to an
 * empty field fills it again). Anything the user typed stays.
 */
export const receivedAmountFor = (
  invoice: { amountMinor: number; currency: Currency },
  currency: Currency,
  amount: string
): string => {
  const invoiced = toMajor(invoice.amountMinor).toFixed(2);

  if (currency === invoice.currency) {
    return amount.trim() === "" ? invoiced : amount;
  }

  return amount === invoiced ? "" : amount;
};

export interface MarkPaidRequest {
  amountMinor: number;
  currency: Currency;
  paidDate: string;
}

export const markPaidFormToRequest = (
  values: MarkPaidFormValues
): MarkPaidRequest => ({
  amountMinor: toMinor(parseAmount(values.amount) ?? 0),
  currency: values.currency,
  paidDate: values.paidDate,
});
