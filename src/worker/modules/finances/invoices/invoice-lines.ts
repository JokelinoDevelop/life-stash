import {
  invoiceTotals,
  lineAmounts,
} from "@shared/domain/finances/invoice-document";
import type { InvoiceTotals } from "@shared/domain/finances/invoice-document";

import type { NewInvoiceLine } from "./invoice-lines.repository";

/** One line as typed: what, how many (thousandths), unit, price and VAT rate. */
export interface InvoiceLineInput {
  description: string;
  quantityMilli: number;
  unit: string | null;
  unitPriceMinor: number;
  vatRateBp: number;
}

export interface PricedLines {
  rows: NewInvoiceLine[];
  totals: InvoiceTotals;
}

/**
 * Computes each line's amount and VAT (half-up, per line) and the invoice totals. Without
 * VAT registration every rate is 0, whatever was sent.
 */
export const priceLines = (
  lines: readonly InvoiceLineInput[],
  vatRegistered: boolean
): PricedLines => {
  const rows = lines.map((line) => {
    const vatRateBp = vatRegistered ? line.vatRateBp : 0;

    return {
      ...line,
      ...lineAmounts({ ...line, vatRateBp }),
      vatRateBp,
    };
  });

  return { rows, totals: invoiceTotals(rows) };
};
