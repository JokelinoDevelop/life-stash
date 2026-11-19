import { formatShortDate } from "@shared/domain/dates";
import { invoicesToRemind } from "@shared/domain/finances/reminders";
import type { Currency } from "@shared/domain/money";

import type { PushMessage } from "../../../core/push";
import type { ClockPort } from "../household/clock";
import type { HouseholdRepository } from "../household/household.repository";
import type { InvoicesRepositoryPort } from "../invoices/invoices.repository";
import type { FinanceSettingsService } from "../settings/settings.service";

const money = (amountMinor: number, currency: Currency, locale: "en" | "mk") =>
  new Intl.NumberFormat(locale === "mk" ? "mk-MK" : "en-GB", {
    currency,
    maximumFractionDigits: currency === "MKD" ? 0 : 2,
    style: "currency",
  }).format(amountMinor / 100);

const TEXT = {
  en: {
    body: (number: string, client: string, amount: string, due: string) =>
      `${number} for ${client} (${amount}) was due ${due}. Tap to mark it paid.`,
    title: "Invoice overdue",
  },
  mk: {
    body: (number: string, client: string, amount: string, due: string) =>
      `${number} за ${client} (${amount}) доспеа на ${due}. Допрете за да ја означите платена.`,
    title: "Задоцнета фактура",
  },
} as const;

/**
 * Daily cron: one push heads-up per invoice the day after it becomes overdue (when the household
 * keeps "Remind me about overdue invoices" on). Tapping opens Mark paid.
 */
export class OverdueRemindersService {
  readonly #invoices: Pick<InvoicesRepositoryPort, "list" | "markNotified">;
  readonly #settings: Pick<FinanceSettingsService, "get">;
  readonly #household: Pick<HouseholdRepository, "preferences">;
  readonly #clock: ClockPort;
  readonly #send: (message: PushMessage) => Promise<void>;

  constructor(deps: {
    invoices: Pick<InvoicesRepositoryPort, "list" | "markNotified">;
    settings: Pick<FinanceSettingsService, "get">;
    household: Pick<HouseholdRepository, "preferences">;
    clock: ClockPort;
    send: (message: PushMessage) => Promise<void>;
  }) {
    this.#invoices = deps.invoices;
    this.#settings = deps.settings;
    this.#household = deps.household;
    this.#clock = deps.clock;
    this.#send = deps.send;
  }

  /** Sends the due heads-ups; returns the ids it notified. */
  async run(): Promise<string[]> {
    const settings = await this.#settings.get();

    if (!settings.overdueReminders) {
      return [];
    }

    const [invoices, today, prefs] = await Promise.all([
      this.#invoices.list(),
      this.#clock.today(),
      this.#household.preferences(),
    ]);

    const due = invoicesToRemind(invoices, today);
    const text = TEXT[prefs.locale];

    await Promise.all(
      due.map(async (invoice) => {
        await this.#send({
          body: text.body(
            invoice.number,
            invoice.clientName,
            money(invoice.amountMinor, invoice.currency, prefs.locale),
            formatShortDate(invoice.dueDate)
          ),
          tag: `invoice-overdue-${invoice.id}`,
          title: text.title,
          url: `/finances/invoices?dialog=mark-paid&id=${invoice.id}`,
        });
      })
    );

    const ids = due.map((invoice) => invoice.id);
    await this.#invoices.markNotified(ids, this.#clock.now().toISOString());

    return ids;
  }
}
