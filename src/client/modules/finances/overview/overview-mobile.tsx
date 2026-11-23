import { NO_RATES } from "@shared/domain/exchange";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Money } from "@/components/app/money";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";

import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { financeSettingsQuery } from "../settings/finance-settings.queries";
import { headline, percentChange, subtractTotals } from "./money-split";
import { NetBars } from "./net-bars";
import type { FinanceOverview } from "./overview.queries";

/**
 * Phone: one-tap Expense / Income / Invoice as small chips under the hero
 * card (they shortcut the tab bar's +, so they stay out of the way).
 */
const QuickActions = () => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => {
          void dialog.open({ dialog: "transaction", entryKind: "expense" });
        }}
        size="compact"
        variant="chip"
      >
        <ArrowUpRight />
        {t("overview.quick.expense")}
      </Button>
      <Button
        onClick={() => {
          void dialog.open({ dialog: "transaction", entryKind: "income" });
        }}
        size="compact"
        variant="chip"
      >
        <ArrowDownLeft />
        {t("overview.quick.income")}
      </Button>
      <Button
        onClick={() => {
          void dialog.open({ dialog: "invoice" });
        }}
        size="compact"
        variant="chip"
      >
        <FileText />
        {t("overview.quick.invoice")}
      </Button>
    </div>
  );
};

/** Phone: the "Net this year" card, then quick actions with monthly bars (5.1). */
export const OverviewMobileTop = ({
  overview,
}: {
  overview: FinanceOverview;
}) => {
  const { t } = useTranslation("finances");
  const format = useFormat();

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

  return (
    <div className="flex flex-col gap-4 md:hidden">
      <section className="surface bg-card flex flex-col gap-1 rounded-lg border p-4">
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
        <span className="mt-0.5 text-4xl font-semibold tracking-tight">
          {net.primary === null ? (
            "—"
          ) : (
            <Money
              amountMinor={net.primary.amountMinor}
              currency={net.primary.currency}
            />
          )}
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
        <NetBars
          currency={currency}
          months={months}
          today={overview.today}
          year={overview.year}
        />
      </section>
      <QuickActions />
    </div>
  );
};
