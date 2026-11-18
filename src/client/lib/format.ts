import { formatPartialDate } from "@shared/domain/dates";
import type { DatePrecision } from "@shared/domain/dates";
import { toMajor } from "@shared/domain/money";
import type { Currency, MoneyTotal } from "@shared/domain/money";
import { kmToDisplay } from "@shared/domain/units";
import type { DistanceUnit } from "@shared/domain/units";
import { useTranslation } from "react-i18next";

import { usePreferences } from "./session";

const numberLocale = (language: string) =>
  language === "mk" ? "mk-MK" : "en-GB";

const integerFormats = new Map<string, Intl.NumberFormat>();
const moneyFormats = new Map<string, Intl.NumberFormat>();

const integerFormat = (locale: string): Intl.NumberFormat => {
  const cached = integerFormats.get(locale);

  if (cached) {
    return cached;
  }

  const created = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  integerFormats.set(locale, created);

  return created;
};

const moneyFormat = (locale: string, currency: Currency): Intl.NumberFormat => {
  const key = `${locale}:${currency}`;
  const cached = moneyFormats.get(key);

  if (cached) {
    return cached;
  }

  const created = new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: currency === "MKD" ? 0 : 2,
    minimumFractionDigits: 0,
    style: "currency",
  });

  moneyFormats.set(key, created);

  return created;
};

const formatDate = (iso: string, precision: DatePrecision = "day"): string =>
  formatPartialDate(iso, precision);

/** Display helpers bound to the user's language, distance unit and currency. */
export const useFormat = () => {
  const { t, i18n } = useTranslation();
  const { data: preferences } = usePreferences();
  const unit: DistanceUnit = preferences?.distanceUnit ?? "km";
  const currency: Currency = preferences?.currency ?? "MKD";
  const locale = numberLocale(i18n.language);

  const number = (value: number): string => integerFormat(locale).format(value);

  const unitLabel = t(`units.${unit}`);

  const distance = (km: number): string =>
    `${number(kmToDisplay(km, unit))} ${unitLabel}`;

  const money = (amountMinor: number, code: Currency = currency): string =>
    moneyFormat(locale, code).format(toMajor(amountMinor));

  const totals = (values: readonly MoneyTotal[]): string =>
    values.length === 0
      ? "—"
      : values
          .map((value) => money(value.amountMinor, value.currency))
          .join(" + ");

  return { date: formatDate, currency, distance, money, number, totals, unit };
};
