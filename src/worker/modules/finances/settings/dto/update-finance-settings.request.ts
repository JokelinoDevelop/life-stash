import { INVOICE_NUMBER_FORMATS } from "@shared/domain/finances/invoices";
import { z } from "zod";

export const updateFinanceSettingsRequest = z.object({
  defaultPaymentTermsDays: z.number().int().min(0).max(365).optional(),
  invoiceNumberFormat: z.enum(INVOICE_NUMBER_FORMATS).optional(),
  overdueReminders: z.boolean().optional(),
});
