import type { InvoiceLanguage } from "@shared/domain/finances/invoice-document";
import {
  BASIS_POINTS,
  QUANTITY_SCALE,
} from "@shared/domain/finances/invoice-document";
import { toMajor } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";

const LOCALE: Record<InvoiceLanguage, string> = { en: "en-GB", mk: "mk-MK" };

const PERCENT = 100;

const QUANTITY: Record<InvoiceLanguage, Intl.NumberFormat> = {
  en: new Intl.NumberFormat(LOCALE.en, {
    maximumFractionDigits: 3,
  }),
  mk: new Intl.NumberFormat(LOCALE.mk, {
    maximumFractionDigits: 3,
  }),
};

const RATE: Record<InvoiceLanguage, Intl.NumberFormat> = {
  en: new Intl.NumberFormat(LOCALE.en, { maximumFractionDigits: 2 }),
  mk: new Intl.NumberFormat(LOCALE.mk, { maximumFractionDigits: 2 }),
};

const AMOUNT: Record<InvoiceLanguage, Intl.NumberFormat> = {
  en: new Intl.NumberFormat(LOCALE.en, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }),
  mk: new Intl.NumberFormat(LOCALE.mk, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }),
};

const MONEY = new Map<string, Intl.NumberFormat>();

/** €3,225.00 / 3.225,00 € (always two decimals on an invoice). */
const moneyFormat = (
  language: InvoiceLanguage,
  currency: Currency
): Intl.NumberFormat => {
  const key = `${language}:${currency}`;
  const cached = MONEY.get(key);

  if (cached !== undefined) {
    return cached;
  }

  const created = new Intl.NumberFormat(LOCALE[language], {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  });

  MONEY.set(key, created);

  return created;
};

/** 20.11.2026 in both languages. */
const date = (iso: string): string =>
  `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

/** Formatting for the printed invoice: always in the invoice's language, never the UI's. */
export const invoicePdfFormat = (language: InvoiceLanguage) => ({
  date,
  /** A line's price or amount, without the currency: "2,000.00". */
  amount: (minor: number): string => AMOUNT[language].format(toMajor(minor)),
  money: (minor: number, currency: Currency): string =>
    moneyFormat(language, currency).format(toMajor(minor)),
  /** 01.11–30.11.2026 within a year, both dates in full across years. */
  period: (start: string, end: string | null): string => {
    if (end === null || end === start) {
      return date(start);
    }

    const sameYear = start.slice(0, 4) === end.slice(0, 4);

    return `${sameYear ? date(start).slice(0, 5) : date(start)}–${date(end)}`;
  },
  /** "80 hrs", "1.5", "1". */
  quantity: (milli: number, unit: string | null): string => {
    const value = QUANTITY[language].format(milli / QUANTITY_SCALE);

    return unit === null || unit === "" ? value : `${value} ${unit}`;
  },
  /** 1800 → "18%". */
  rate: (bp: number): string =>
    `${RATE[language].format(bp / (BASIS_POINTS / PERCENT))}%`,
});

export type InvoicePdfFormat = ReturnType<typeof invoicePdfFormat>;
