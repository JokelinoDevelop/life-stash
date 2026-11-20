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
