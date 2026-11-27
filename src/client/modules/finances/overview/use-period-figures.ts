import { NO_RATES } from "@shared/domain/exchange";
import { monthsInRange, wholeYear } from "@shared/domain/finances/period";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useFormat } from "@/lib/format";

import { financeSettingsQuery } from "../settings/finance-settings.queries";
import { headline, percentChange, subtractTotals } from "./money-split";
import type { FinanceOverview } from "./overview.queries";
import { useBucketLabel } from "./period-labels";

/**
 * Earned, spent and net of the overview's period as headline figures (every currency in the
 * main one when rates are known), the change vs the period before, and a "since …" or
 * "vs 2025" hint, shared by the desktop KPI strip and the phone hero card.
 */
export const usePeriodFigures = (overview: FinanceOverview) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const bucketLabel = useBucketLabel();
  const main = format.currency;
  const rates = useQuery(financeSettingsQuery).data?.exchangeRates ?? NO_RATES;
  const earned = headline(overview.earned, main, rates);
  const spent = headline(overview.spent, main, rates);

  const net = headline(
    subtractTotals(overview.earned, overview.spent),
    main,
    rates
  );

  const before =
    overview.previous === null
      ? null
      : headline(overview.previous.earned, main, rates).primary;

  const change =
    earned.primary === null ||
    before === null ||
    before.currency !== earned.primary.currency
      ? null
      : percentChange(earned.primary.amountMinor, before.amountMinor);

  const previousYear =
    overview.previous === null ? null : wholeYear(overview.previous.range);

  const previousLabel =
    previousYear === null ? t("overview.previousPeriod") : String(previousYear);

  let comparison = t("overview.since", {
    date: bucketLabel(overview.range.from.slice(0, 7), "long"),
  });

  if (overview.previous !== null) {
    comparison =
      change === null
        ? t("overview.noBefore", { period: previousLabel })
        : t("overview.vsBefore", {
            change: `${change > 0 ? "+" : ""}${change}%`,
            period: previousLabel,
          });
  }

  // Months that have started, for "a month on average".
  const months = monthsInRange({
    from: overview.range.from,
    to: overview.range.to < overview.today ? overview.range.to : overview.today,
  });

  const perMonth =
    net.primary === null
      ? undefined
      : t("overview.perMonth", {
          amount: format.money(
            Math.round(net.primary.amountMinor / months),
            net.primary.currency
          ),
        });

  return { change, comparison, earned, net, perMonth, previousLabel, spent };
};
