import type { ExchangeRates } from "@shared/domain/exchange";
import type { InvoiceNumberFormat } from "@shared/domain/finances/invoices";

import type { FinanceSettings } from "../settings.service";

export interface GetFinanceSettingsResponse {
  defaultPaymentTermsDays: number;
  exchangeRates: ExchangeRates;
  invoiceNumberFormat: InvoiceNumberFormat;
  overdueReminders: boolean;
}

export const toGetFinanceSettingsResponse = (
  settings: FinanceSettings
): GetFinanceSettingsResponse => ({
  defaultPaymentTermsDays: settings.defaultPaymentTermsDays,
  exchangeRates: settings.exchangeRates,
  invoiceNumberFormat: settings.invoiceNumberFormat,
  overdueReminders: settings.overdueReminders,
});
