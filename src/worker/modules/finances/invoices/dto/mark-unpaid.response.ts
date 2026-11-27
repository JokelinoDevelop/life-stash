import type { Currency } from "@shared/domain/money";

/** The removed payment, so the client's Undo can book it again. */
export interface MarkUnpaidResponse {
  paidDate: string;
  amountMinor: number;
  currency: Currency;
}
