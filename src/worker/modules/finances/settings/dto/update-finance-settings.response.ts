import type { InvoiceNumberFormat } from "@shared/domain/finances/invoices";

export interface UpdateFinanceSettingsResponse {
  defaultPaymentTermsDays: number;
  invoiceNumberFormat: InvoiceNumberFormat;
  overdueReminders: boolean;
}
