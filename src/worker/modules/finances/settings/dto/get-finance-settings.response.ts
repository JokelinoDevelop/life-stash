import type { InvoiceNumberFormat } from "@shared/domain/finances/invoices";

import type { FinanceSettings } from "../settings.service";

export interface GetFinanceSettingsResponse {
  defaultPaymentTermsDays: number;
  invoiceNumberFormat: InvoiceNumberFormat;
  overdueReminders: boolean;
}

export const toGetFinanceSettingsResponse = (
  settings: FinanceSettings
): GetFinanceSettingsResponse => ({
  defaultPaymentTermsDays: settings.defaultPaymentTermsDays,
  invoiceNumberFormat: settings.invoiceNumberFormat,
  overdueReminders: settings.overdueReminders,
});
