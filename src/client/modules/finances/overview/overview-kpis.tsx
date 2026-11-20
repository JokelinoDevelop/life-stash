import { NO_RATES } from "@shared/domain/exchange";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Stat, StatPanel } from "@/components/app/stat-panel";
import { useFormat } from "@/lib/format";

import { financeSettingsQuery } from "../settings/finance-settings.queries";
import { headline, percentChange, subtractTotals } from "./money-split";
import type { Headline } from "./money-split";
import type { FinanceOverview } from "./overview.queries";

/** Earned (vs last year) · Spent (+ other currencies) · Net (monthly average) · Waiting. */
export const OverviewKpis = ({ overview }: { overview: FinanceOverview }) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const main = format.currency;
  const rates = useQuery(financeSettingsQuery).data?.exchangeRates ?? NO_RATES;
  const netTotals = subtractTotals(overview.earned, overview.spent);
  const earned = headline(overview.earned, main, rates);
  const spent = headline(overview.spent, main, rates);
  const net = headline(netTotals, main, rates);

  const waiting = overview.receivables;

  const lastYear = headline(overview.earnedLastYear, main, rates);

  const change =
    earned.primary === null ||
    lastYear.primary === null ||
    lastYear.primary.currency !== earned.primary.currency
      ? null
      : percentChange(earned.primary.amountMinor, lastYear.primary.amountMinor);

  /** "incl. €53,750" when converted, "+ €53,750 in EUR" when kept apart. */
  const otherParts = (figure: Headline): string[] =>
    figure.others.map((total) =>
      t(figure.converted ? "overview.including" : "overview.inOther", {
        amount: format.money(total.amountMinor, total.currency),
        currency: total.currency,
      })
    );

  const money = (
    total: { amountMinor: number; currency: typeof main } | null
  ) => (total === null ? "—" : format.money(total.amountMinor, total.currency));

  let waitingHint = t("overview.allPaid");

  if (waiting.overdueCount > 0) {
    waitingHint = t("overview.overdueOf", {
      amount: format.totals(waiting.overdue),
      count: waiting.unpaidCount,
    });
  } else if (waiting.unpaidCount > 0) {
    waitingHint = t("overview.nothingOverdue", { count: waiting.unpaidCount });
  }

  return (
    <StatPanel bleed>
      <Stat
        hint={[
          ...otherParts(earned),
          change === null
            ? t("overview.noLastYear", { year: overview.year - 1 })
            : t("overview.vsLastYear", {
                change: `${change > 0 ? "+" : ""}${change}%`,
                year: overview.year - 1,
              }),
        ].join(" · ")}
        label={t("overview.earned")}
        value={money(earned.primary)}
      />
      <Stat
        hint={
          spent.others.length === 0 ? undefined : otherParts(spent).join(" · ")
        }
        label={t("overview.spent")}
        value={money(spent.primary)}
      />
      <Stat
        hint={
          net.primary === null
            ? undefined
            : t("overview.perMonth", {
                amount: format.money(
                  Math.round(
                    net.primary.amountMinor /
                      Math.max(1, overview.monthsElapsed)
                  ),
                  net.primary.currency
                ),
              })
        }
        label={t("overview.net")}
        value={money(net.primary)}
      />
      <Stat
        hint={
          <span
            className={
              waiting.overdueCount > 0 ? "text-destructive" : undefined
            }
          >
            {waitingHint}
          </span>
        }
        label={t("overview.waiting")}
        value={format.totals(waiting.unpaid)}
      />
    </StatPanel>
  );
};
