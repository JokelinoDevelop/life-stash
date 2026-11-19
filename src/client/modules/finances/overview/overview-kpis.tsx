import { useTranslation } from "react-i18next";

import { Stat, StatPanel } from "@/components/app/stat-panel";
import { useFormat } from "@/lib/format";

import { percentChange, splitTotals, subtractTotals } from "./money-split";
import type { FinanceOverview } from "./overview.queries";

/** Earned (vs last year) · Spent (+ other currencies) · Net (monthly average) · Waiting. */
export const OverviewKpis = ({ overview }: { overview: FinanceOverview }) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const main = format.currency;
  const earned = splitTotals(overview.earned, main);
  const spent = splitTotals(overview.spent, main);

  const net = splitTotals(
    subtractTotals(overview.earned, overview.spent),
    main
  );

  const waiting = overview.receivables;

  const lastYear = overview.earnedLastYear.find(
    (total) => total.currency === earned.primary?.currency
  );

  const change =
    earned.primary === null || lastYear === undefined
      ? null
      : percentChange(earned.primary.amountMinor, lastYear.amountMinor);

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
          ...earned.others.map((total) =>
            t("overview.inOther", {
              amount: format.money(total.amountMinor, total.currency),
              currency: total.currency,
            })
          ),
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
          spent.others.length === 0
            ? undefined
            : spent.others
                .map((total) =>
                  t("overview.inOther", {
                    amount: format.money(total.amountMinor, total.currency),
                    currency: total.currency,
                  })
                )
                .join(" ")
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
