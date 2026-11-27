import type { Currency } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { SectionHeading } from "@/components/app/list-section";
import { Stat, StatPanel } from "@/components/app/stat-panel";
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { FinanceOverview } from "./overview.queries";
import { useBucketLabel } from "./period-labels";

/**
 * Highlights of the period in one currency: average money in and out per month, the share
 * of income kept, and the best and worst month by net.
 */
export const Highlights = ({
  currency,
  overview,
}: {
  currency: Currency;
  overview: FinanceOverview;
}) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const label = useBucketLabel();

  const figures = overview.highlights.find(
    (entry) => entry.currency === currency
  );

  if (figures === undefined) {
    return null;
  }

  const signed = (amountMinor: number) =>
    `${amountMinor < 0 ? "−" : "+"}${format.money(Math.abs(amountMinor), currency)}`;

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading
        action={
          <span className="text-muted-foreground text-xs">
            {t("overview.highlights.description", { count: figures.months })}
          </span>
        }
        title={t("overview.highlights.title")}
      />
      <StatPanel>
        <Stat
          hint={t("overview.highlights.avgOut", {
            amount: format.money(figures.avgExpenseMinor, currency),
          })}
          label={t("overview.highlights.avgIn")}
          value={format.money(figures.avgIncomeMinor, currency)}
        />
        <Stat
          hint={
            figures.savingsRatePercent === null
              ? undefined
              : t("overview.highlights.keptHint", {
                  amount: signed(figures.avgNetMinor),
                })
          }
          label={t("overview.highlights.kept")}
          value={
            figures.savingsRatePercent === null ? (
              "—"
            ) : (
              <span
                className={cn(
                  figures.savingsRatePercent < 0 && "text-destructive"
                )}
              >
                {figures.savingsRatePercent}%
              </span>
            )
          }
        />
        <Stat
          hint={
            figures.best === null
              ? t("overview.highlights.needMonths")
              : label(figures.best.key, "long")
          }
          label={t("overview.highlights.best")}
          value={figures.best === null ? "—" : signed(figures.best.netMinor)}
        />
        <Stat
          hint={
            figures.worst === null
              ? t("overview.highlights.needMonths")
              : label(figures.worst.key, "long")
          }
          label={t("overview.highlights.worst")}
          value={
            figures.worst === null ? (
              "—"
            ) : (
              <span
                className={cn(figures.worst.netMinor < 0 && "text-destructive")}
              >
                {signed(figures.worst.netMinor)}
              </span>
            )
          }
        />
      </StatPanel>
    </section>
  );
};
