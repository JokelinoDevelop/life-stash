import { NO_RATES } from "@shared/domain/exchange";
import type { MoneyTotal } from "@shared/domain/money";
import { useQuery } from "@tanstack/react-query";

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
  const rates = useQuery(financeSettingsQuery).data?.exchangeRates ?? NO_RATES;

  return (values: readonly MoneyTotal[]): string => {
    if (values.length <= 1) {
      return format.totals(values);
    }

    const figure = headline(values, format.currency, rates);

    if (figure.converted && figure.primary !== null) {
      return `≈ ${format.money(figure.primary.amountMinor, figure.primary.currency)}`;
    }

    return format.totals(
      figure.primary === null ? values : [figure.primary, ...figure.others]
    );
  };
};
