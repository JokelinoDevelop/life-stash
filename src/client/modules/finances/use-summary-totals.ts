import { NO_RATES } from "@shared/domain/exchange";
import { toMajor } from "@shared/domain/money";
import type { MoneyTotal } from "@shared/domain/money";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useFormat } from "@/lib/format";

import { headline } from "./overview/money-split";
import { financeSettingsQuery } from "./settings/finance-settings.queries";

/**
 * Totals for a one-line summary (a page description, Today's line): one
 * figure. Several currencies become "≈ MKD 586,320" in the main currency when
 * every rate is known, otherwise the main currency leads ("MKD 3,200 + €9,483").
 * Exact per-currency amounts stay in the rows and tables below.
 */
export const useSummaryTotals = () => {
  const format = useFormat();
  const { i18n } = useTranslation();
  const rates = useQuery(financeSettingsQuery).data?.exchangeRates ?? NO_RATES;

  /** "MKD 1.04M": three significant digits, for a tile with no room for the full figure. */
  const short = (total: MoneyTotal): string =>
    new Intl.NumberFormat(i18n.language === "mk" ? "mk-MK" : "en-GB", {
      currency: total.currency,
      maximumSignificantDigits: 3,
      notation: "compact",
      style: "currency",
    }).format(toMajor(total.amountMinor));

  return (
    values: readonly MoneyTotal[],
    options: { compact?: boolean } = {}
  ): string => {
    const [only] = values;

    if (options.compact === true && values.length === 1 && only !== undefined) {
      return short(only);
    }

    if (values.length <= 1) {
      return format.totals(values);
    }

    const figure = headline(values, format.currency, rates);

    if (figure.converted && figure.primary !== null) {
      // A compact figure is already rounded, so it drops the "≈".
      return options.compact === true
        ? short(figure.primary)
        : `≈ ${format.money(figure.primary.amountMinor, figure.primary.currency)}`;
    }

    return format.totals(
      figure.primary === null ? values : [figure.primary, ...figure.others]
    );
  };
};
