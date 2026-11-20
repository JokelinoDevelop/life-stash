import { NO_RATES } from "@shared/domain/exchange";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";

import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { financeSettingsQuery } from "../settings/finance-settings.queries";
import { headline, percentChange, subtractTotals } from "./money-split";
import type { FinanceOverview } from "./overview.queries";

/** Phone: quick actions and the "Net this year" card with monthly bars (5.1). */
export const OverviewMobileTop = ({
  overview,
}: {
  overview: FinanceOverview;
}) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const dialog = useFinanceDialog();

  const rates = useQuery(financeSettingsQuery).data?.exchangeRates ?? NO_RATES;
  const main = format.currency;

  const net = headline(
    subtractTotals(overview.earned, overview.spent),
    main,
    rates
  );

  const earned = headline(overview.earned, main, rates);
  const spent = headline(overview.spent, main, rates);
  const lastYear = headline(overview.earnedLastYear, main, rates).primary;
  const currency = net.primary?.currency ?? main;

  const change =
    earned.primary === null ||
    lastYear === null ||
    lastYear.currency !== earned.primary.currency
      ? null
      : percentChange(earned.primary.amountMinor, lastYear.amountMinor);

  const months =
    overview.cashflow.find((series) => series.currency === currency)?.months ??
    [];

  const highest = Math.max(
    1,
    ...months.map((month) => Math.max(month.incomeMinor, month.expenseMinor))
  );

  return (
    <div className="flex flex-col gap-4 md:hidden">
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={() => {
            void dialog.open({ dialog: "transaction", entryKind: "expense" });
          }}
          size="tile"
          variant="outline"
        >
          <ArrowUpRight />
          {t("overview.quick.expense")}
        </Button>
        <Button
          onClick={() => {
            void dialog.open({ dialog: "transaction", entryKind: "income" });
          }}
          size="tile"
          variant="outline"
        >
          <ArrowDownLeft />
          {t("overview.quick.income")}
        </Button>
        <Button
          onClick={() => {
            void dialog.open({ dialog: "invoice" });
          }}
          size="tile"
          variant="outline"
        >
          <FileText />
          {t("overview.quick.invoice")}
        </Button>
      </div>
      <section className="bg-card flex flex-col gap-1 rounded-lg border p-4">
        <div className="text-muted-foreground flex items-baseline justify-between text-xs">
          <span className="font-medium">
            {t("overview.netIn", { year: overview.year })}
          </span>
          {change !== null && (
            <span className="tabular-nums">
              {t("overview.earnedChange", {
                change: `${change > 0 ? "+" : ""}${change}%`,
                year: overview.year - 1,
              })}
            </span>
          )}
        </div>
        <span className="text-2xl font-semibold tracking-tight tabular-nums">
          {net.primary === null
            ? "—"
            : format.money(net.primary.amountMinor, net.primary.currency)}
        </span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {t("overview.in")}{" "}
          {earned.primary === null
            ? "—"
            : format.money(earned.primary.amountMinor, earned.primary.currency)}
          {"  ·  "}
          {t("overview.out")}{" "}
          {spent.primary === null
            ? "—"
            : format.money(spent.primary.amountMinor, spent.primary.currency)}
        </span>
        <div aria-hidden="true" className="mt-3 flex h-14 items-end gap-1">
          {months.map((month) => (
            <span
              className="flex h-full flex-1 items-end gap-px"
              key={month.month}
            >
              <span
                className="bg-chart-1 h-(--bar) flex-1 rounded-t-sm"
                style={{ "--bar": `${(month.incomeMinor / highest) * 100}%` }}
              />
              <span
                className="bg-chart-3 h-(--bar) flex-1 rounded-t-sm"
                style={{ "--bar": `${(month.expenseMinor / highest) * 100}%` }}
              />
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};
