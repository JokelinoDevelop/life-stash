import { INVOICE_NUMBER_FORMATS } from "@shared/domain/finances/invoices";
import { CURRENCIES } from "@shared/domain/money";
import { z } from "zod";

export const updateFinanceSettingsRequest = z.object({
  defaultPaymentTermsDays: z.number().int().min(0).max(365).optional(),
  /** "1 EUR = 61.5 MKD" is `{ base: "MKD", rates: { EUR: 61.5 } }`. */
  exchangeRates: z
    .object({
      base: z.enum(CURRENCIES),
      rates: z.partialRecord(
        z.enum(CURRENCIES),
        z.number().positive().max(1_000_000)
      ),
    })
    .optional(),
  invoiceNumberFormat: z.enum(INVOICE_NUMBER_FORMATS).optional(),
  overdueReminders: z.boolean().optional(),
});
