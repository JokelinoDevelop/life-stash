import type { MoneyTotal } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { AnimatedTotals } from "@/components/app/animated-number";
import { Stat, StatPanel } from "@/components/app/stat-panel";
import { useFormat } from "@/lib/format";

import type { InvoiceList } from "./invoices.queries";

const amountOf = (totals: readonly MoneyTotal[]): number =>
  totals.reduce((sum, total) => sum + total.amountMinor, 0);

/** Invoiced · paid · unpaid (with a not-due / overdue bar) · average days to get paid. */
export const InvoicesStats = ({ list }: { list: InvoiceList }) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const { stats } = list;
  const unpaid = amountOf(stats.unpaid);
  const overdue = amountOf(stats.overdue);
  const notDue = Math.max(0, unpaid - overdue);

  const notDueTotals = stats.unpaid.map((total) => ({
    ...total,
    amountMinor:
      total.amountMinor -
      (stats.overdue.find((late) => late.currency === total.currency)
        ?.amountMinor ?? 0),
  }));

  return (
    <StatPanel bleed>
      <Stat
        label={t("invoices.invoicedIn", { year: list.year })}
        value={<AnimatedTotals values={stats.invoiced} />}
      />
      <Stat
        label={t("invoices.paid")}
        value={<AnimatedTotals values={stats.paid} />}
      />
      <Stat
        hint={
          unpaid > 0 ? (
            <>
              <span className="sr-only">
                {t("invoices.agingLabel", {
                  notDue: format.totals(notDueTotals),
                  overdue: format.totals(stats.overdue),
                })}
              </span>
              <span
                aria-hidden="true"
                className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full"
              >
                <span
                  className="bg-primary grow-(--grow) rounded-full"
                  style={{ "--grow": notDue }}
                />
                <span
                  className="bg-destructive grow-(--grow) rounded-full"
                  style={{ "--grow": overdue }}
                />
              </span>
            </>
          ) : undefined
        }
        label={t("invoices.unpaid")}
        value={<AnimatedTotals values={stats.unpaid} />}
      />
      <Stat
        label={t("invoices.avgDays")}
        value={
          stats.averageDaysToGetPaid === null
            ? "—"
            : String(stats.averageDaysToGetPaid)
        }
      />
    </StatPanel>
  );
};
