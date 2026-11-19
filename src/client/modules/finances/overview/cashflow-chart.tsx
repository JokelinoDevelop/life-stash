import { toMajor } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
// Recharts is only reached through React.lazy (see overview-view.tsx), so it is code-split.
// oxlint-disable-next-line react-doctor/prefer-dynamic-import
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { useFormat } from "@/lib/format";

import type { FinanceOverview } from "./overview.queries";

const MONTHS = 12;

interface Row {
  label: string;
  income: number;
  expense: number;
  net: number;
}

const isRow = (value: unknown): value is Row =>
  typeof value === "object" &&
  value !== null &&
  "net" in value &&
  "income" in value;

/** Tooltip: in · out · net for the hovered month. */
const CashflowTooltip = ({
  active,
  currency,
  payload,
}: {
  active?: boolean;
  currency: Currency;
  payload?: readonly { payload?: unknown }[];
}) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const row = payload?.[0]?.payload;

  if (active !== true || !isRow(row)) {
    return null;
  }

  const money = (major: number) =>
    format.money(Math.round(major * 100), currency);

  return (
    <div className="bg-popover text-popover-foreground grid min-w-36 gap-1 rounded-md border px-2.5 py-1.5 text-xs shadow-md">
      <span className="font-medium">{row.label}</span>
      <span className="flex justify-between gap-3 tabular-nums">
        <span className="text-muted-foreground">{t("overview.in")}</span>
        {money(row.income)}
      </span>
      <span className="flex justify-between gap-3 tabular-nums">
        <span className="text-muted-foreground">{t("overview.out")}</span>
        {money(row.expense)}
      </span>
      <span className="flex justify-between gap-3 font-medium tabular-nums">
        <span className="text-muted-foreground font-normal">
          {t("overview.net2")}
        </span>
        {money(row.net)}
      </span>
    </div>
  );
};

/** Income vs spending per month in one currency, with a y-axis and an in · out · net tooltip. */
const CashflowChart = ({
  currency,
  overview,
}: {
  currency: Currency;
  overview: FinanceOverview;
}) => {
  const { t, i18n } = useTranslation("finances");
  const locale = i18n.language === "mk" ? "mk-MK" : "en-GB";
  const series = overview.cashflow.find((entry) => entry.currency === currency);

  const { compact, monthName } = useMemo(
    () => ({
      compact: new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
        notation: "compact",
      }),
      monthName: new Intl.DateTimeFormat(locale, {
        month: "short",
        timeZone: "UTC",
      }),
    }),
    [locale]
  );

  const rows: Row[] = Array.from({ length: MONTHS }, (_, index) => {
    const month = series?.months[index];

    return {
      expense: toMajor(month?.expenseMinor ?? 0),
      income: toMajor(month?.incomeMinor ?? 0),
      label: monthName.format(new Date(Date.UTC(overview.year, index, 1))),
      net: toMajor(month?.netMinor ?? 0),
    };
  });

  const config: ChartConfig = {
    expense: { color: "var(--chart-3)", label: t("overview.spending") },
    income: { color: "var(--chart-1)", label: t("overview.income") },
  };

  return (
    <ChartContainer
      aria-label={t("overview.chartLabel", { year: overview.year })}
      className="aspect-auto h-56 w-full"
      config={config}
    >
      <BarChart accessibilityLayer data={rows} margin={{ left: 0, right: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="label"
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          axisLine={false}
          tickFormatter={(value: number) => compact.format(value)}
          tickLine={false}
          width={40}
        />
        <ChartTooltip
          content={<CashflowTooltip currency={currency} />}
          cursor={false}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="income"
          fill="var(--color-income)"
          radius={[3, 3, 0, 0]}
        />
        <Bar
          dataKey="expense"
          fill="var(--color-expense)"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
};

export default CashflowChart;
