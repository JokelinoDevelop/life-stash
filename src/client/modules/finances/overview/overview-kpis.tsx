import type { MoneyTotal } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import {
  AnimatedMoney,
  AnimatedTotals,
} from "@/components/app/animated-number";
import { Stat, StatPanel } from "@/components/app/stat-panel";
import { useFormat } from "@/lib/format";

import type { Headline } from "./money-split";
import type { FinanceOverview } from "./overview.queries";
import { usePeriodFigures } from "./use-period-figures";

/** A headline amount, or "—" when there is nothing to show. */
const headlineValue = (total: MoneyTotal | null) =>
  total === null ? (
    "—"
  ) : (
    <AnimatedMoney amountMinor={total.amountMinor} currency={total.currency} />
  );

/** Earned (vs the period before) · Spent (+ other currencies) · Net (monthly average) · Waiting. */
export const OverviewKpis = ({ overview }: { overview: FinanceOverview }) => {
  const { t } = useTranslation("finances");
  const format = useFormat();

  const { comparison, earned, net, perMonth, spent } =
    usePeriodFigures(overview);

  const waiting = overview.receivables;

  /** "incl. €53,750" when converted, "+ €53,750 in EUR" when kept apart. */
  const otherParts = (figure: Headline): string[] =>
    figure.others.map((total) =>
      t(figure.converted ? "overview.including" : "overview.inOther", {
        amount: format.money(total.amountMinor, total.currency),
        currency: total.currency,
      })
    );

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
        hint={[...otherParts(earned), comparison].join(" · ")}
        label={t("overview.earned")}
        value={headlineValue(earned.primary)}
      />
      <Stat
        hint={
          spent.others.length === 0 ? undefined : otherParts(spent).join(" · ")
        }
        label={t("overview.spent")}
        value={headlineValue(spent.primary)}
      />
      <Stat
        hint={perMonth}
        label={t("overview.net")}
        value={headlineValue(net.primary)}
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
        value={<AnimatedTotals values={waiting.unpaid} />}
      />
    </StatPanel>
  );
};
