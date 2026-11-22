import { convertMinor } from "@shared/domain/exchange";
import type { ExchangeRates } from "@shared/domain/exchange";
import { CURRENCIES } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";

import type { ExchangeRatesFormValues } from "./schema";

type UpdateBody = InferRequestType<typeof api.finances.settings.$patch>["json"];

/** Rates are compared on 1 000 000 units so a 4-decimal rate survives the round trip. */
const PROBE = 1_000_000;

const formatRate = (value: number): string =>
  String(Math.round(value * 10_000) / 10_000);

/** Stored rates (any base) as "1 X = … main" for each other currency. */
export const ratesToFormValues = (
  table: ExchangeRates,
  main: Currency
): ExchangeRatesFormValues => {
  const value = (currency: Currency): string => {
    if (currency === main) {
      return "";
    }

    const converted = convertMinor(PROBE, currency, main, table);

    return converted === null ? "" : formatRate(converted / PROBE);
  };

  return { EUR: value("EUR"), MKD: value("MKD"), USD: value("USD") };
};

/** The form as rates against the main currency; blank fields are left out. */
export const exchangeRatesFormToRequest = (
  values: ExchangeRatesFormValues,
  main: Currency
): UpdateBody => {
  const rates: Partial<Record<Currency, number>> = {};

  for (const currency of CURRENCIES) {
    const text = values[currency].replace(",", ".");

    if (currency !== main && text !== "") {
      rates[currency] = Number(text);
    }
  }

  return { exchangeRates: { base: main, rates } };
};
