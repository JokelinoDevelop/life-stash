import { NO_RATES } from "@shared/domain/exchange";
import type { ExchangeRates } from "@shared/domain/exchange";
import { DEFAULT_PAYMENT_TERMS_DAYS } from "@shared/domain/finances/invoices";
import type { InvoiceNumberFormat } from "@shared/domain/finances/invoices";

import type {
  FinanceSettingsPatch,
  FinanceSettingsRepositoryPort,
} from "./settings.repository";

export interface FinanceSettings {
  defaultPaymentTermsDays: number;
  exchangeRates: ExchangeRates;
  invoiceNumberFormat: InvoiceNumberFormat;
  overdueReminders: boolean;
}

const DEFAULTS: FinanceSettings = {
  defaultPaymentTermsDays: DEFAULT_PAYMENT_TERMS_DAYS,
  exchangeRates: NO_RATES,
  invoiceNumberFormat: "YYYY-NNN",
  overdueReminders: true,
};

/** Finance defaults (payment terms, invoice numbers, overdue reminders, exchange rates). */
export class FinanceSettingsService {
  readonly #repo: FinanceSettingsRepositoryPort;

  constructor(repo: FinanceSettingsRepositoryPort) {
    this.#repo = repo;
  }

  async get(): Promise<FinanceSettings> {
    const row = await this.#repo.find();

    if (!row) {
      return DEFAULTS;
    }

    return {
      defaultPaymentTermsDays: row.defaultPaymentTermsDays,
      exchangeRates: row.exchangeRates ?? NO_RATES,
      invoiceNumberFormat: row.invoiceNumberFormat,
      overdueReminders: row.overdueReminders,
    };
  }

  async update(patch: FinanceSettingsPatch): Promise<FinanceSettings> {
    await this.#repo.upsert(patch);

    return await this.get();
  }
}
