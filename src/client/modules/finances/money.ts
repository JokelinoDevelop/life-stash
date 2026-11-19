import { CURRENCIES } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

const symbolOf = (locale: string, currency: Currency): string =>
  new Intl.NumberFormat(locale, { currency, style: "currency" })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value ?? currency;

/** Currency symbols per language, built once ("€", "$", "ден."). */
const SYMBOLS = {
  en: Object.fromEntries(
    CURRENCIES.map((code) => [code, symbolOf("en-GB", code)])
  ),
  mk: Object.fromEntries(
    CURRENCIES.map((code) => [code, symbolOf("mk-MK", code)])
  ),
};

/** The currency's symbol in the user's language. */
export const useCurrencySymbol = () => {
  const { i18n } = useTranslation();
  const table = i18n.language === "mk" ? SYMBOLS.mk : SYMBOLS.en;

  return (currency: Currency): string => table[currency] ?? currency;
};

const fixedFormats = new Map<string, Intl.NumberFormat>();

/** Ledger amounts: always with cents (MKD whole), optionally signed for income / spending. */
export const useLedgerMoney = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language === "mk" ? "mk-MK" : "en-GB";

  const formatter = (currency: Currency) => {
    const key = `${locale}:${currency}`;
    const cached = fixedFormats.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const digits = currency === "MKD" ? 0 : 2;

    const created = new Intl.NumberFormat(locale, {
      currency,
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
      style: "currency",
    });

    fixedFormats.set(key, created);

    return created;
  };

  const money = (amountMinor: number, currency: Currency): string =>
    formatter(currency).format(amountMinor / 100);

  /** "+€180.00" for income, "−€46.20" for spending. */
  const signed = (
    amountMinor: number,
    currency: Currency,
    kind: "income" | "expense"
  ): string =>
    `${kind === "income" ? "+" : "−"}${money(Math.abs(amountMinor), currency)}`;

  return { money, signed };
};
