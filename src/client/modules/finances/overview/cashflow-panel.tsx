import type { Currency } from "@shared/domain/money";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

import { Panel } from "@/components/app/list-section";
import { LoadingState } from "@/components/app/states";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useMonthLabel } from "../transactions/month-band";
import { subtractTotals } from "./money-split";
import type { FinanceOverview } from "./overview.queries";

const CashflowChart = lazy(async () => await import("./cashflow-chart"));

const isCurrency = (
  value: string,
  options: readonly Currency[]
): value is Currency => options.some((option) => option === value);

/** "Income vs spending": the chart (per currency, never mixed) and this month so far. */
export const CashflowPanel = ({ overview }: { overview: FinanceOverview }) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const month = useMonthLabel();
  const currencies = overview.cashflow.map((series) => series.currency);
  const [picked, setPicked] = useState<Currency | null>(null);

  const currency =
    picked ??
    (currencies.includes(format.currency)
      ? format.currency
      : (currencies[0] ?? format.currency));

  const net = subtractTotals(
    overview.monthSoFar.income,
    overview.monthSoFar.expense
  );

  const showMonth = overview.today.startsWith(`${overview.year}-`);

  return (
    <Panel
      action={
        currencies.length > 1 ? (
          <ToggleGroup
            onValueChange={(value) => {
              if (isCurrency(value, currencies)) {
                setPicked(value);
              }
            }}
            size="segmented"
            spacing={0.5}
            type="single"
            value={currency}
            variant="segmented"
          >
            {currencies.map((code) => (
              <ToggleGroupItem key={code} value={code}>
                {code}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : undefined
      }
      title={t("overview.incomeVsSpending")}
    >
      <Suspense fallback={<LoadingState variant="block" />}>
        <CashflowChart currency={currency} overview={overview} />
      </Suspense>
      {showMonth && (
        <p className="text-muted-foreground border-divider mt-3 flex flex-wrap gap-x-3 border-t pt-3 text-xs tabular-nums">
          <span className="text-foreground font-medium">
            {t("overview.monthSoFar", {
              month: month(overview.today.slice(0, 7), false),
            })}
          </span>
          <span>
            {t("overview.in")}{" "}
            <span className="text-success-foreground">
              {format.totals(overview.monthSoFar.income)}
            </span>
          </span>
          <span>
            {t("overview.out")}{" "}
            <span className="text-foreground">
              {format.totals(overview.monthSoFar.expense)}
            </span>
          </span>
          <span>
            {t("overview.net2")}{" "}
            {net.map((total, index) => (
              <span
                className={cn(
                  "font-medium",
                  total.amountMinor < 0 ? "text-destructive" : "text-foreground"
                )}
                key={total.currency}
              >
                {index > 0 && " · "}
                {total.amountMinor < 0 ? "−" : "+"}
                {format.money(Math.abs(total.amountMinor), total.currency)}
              </span>
            ))}
          </span>
        </p>
      )}
    </Panel>
  );
};
