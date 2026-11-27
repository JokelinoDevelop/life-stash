import { ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Money } from "@/components/app/money";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";

import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { NetBars } from "./net-bars";
import type { OverviewSearch } from "./overview-search";
import type { FinanceOverview } from "./overview.queries";
import { usePeriodLabel } from "./period-labels";
import { usePeriodFigures } from "./use-period-figures";

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

/** Phone: the net card for the period, then quick actions with bars per month (5.1). */
export const OverviewMobileTop = ({
  overview,
  search,
}: {
  overview: FinanceOverview;
  search: OverviewSearch;
}) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const periodLabel = usePeriodLabel();
  const { comparison, earned, net, spent } = usePeriodFigures(overview);
  const currency = net.primary?.currency ?? format.currency;

  const buckets =
    overview.cashflow.find((series) => series.currency === currency)?.buckets ??
    [];

  return (
    <div className="flex flex-col gap-4 md:hidden">
      <section className="surface bg-card flex flex-col gap-1 rounded-lg border p-4">
        <div className="text-muted-foreground flex items-baseline justify-between gap-3 text-xs">
          <span className="truncate font-medium">
            {t("overview.netIn", { period: periodLabel(search) })}
          </span>
          <span className="truncate tabular-nums">{comparison}</span>
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
        {buckets.length > 0 && (
          <NetBars
            buckets={buckets}
            currency={currency}
            granularity={overview.granularity}
            today={overview.today}
          />
        )}
      </section>
      <QuickActions />
    </div>
  );
};
