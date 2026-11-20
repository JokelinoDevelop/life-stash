import type { ExchangeRates } from "@shared/domain/exchange";
import type { InvoiceNumberFormat } from "@shared/domain/finances/invoices";

export interface UpdateFinanceSettingsResponse {
  defaultPaymentTermsDays: number;
  exchangeRates: ExchangeRates;
  invoiceNumberFormat: InvoiceNumberFormat;
  overdueReminders: boolean;
}
