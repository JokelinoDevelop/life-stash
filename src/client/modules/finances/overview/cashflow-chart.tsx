import { bucketRange } from "@shared/domain/finances/period";
import { toMajor } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
// Recharts is only reached through React.lazy (see overview-view.tsx), so it is code-split.
// oxlint-disable-next-line react-doctor/prefer-dynamic-import
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { BarRectangleItem } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { useFormat } from "@/lib/format";

import { transactionsSearchFor } from "./overview-search";
import type { OverviewSearch } from "./overview-search";
import type { FinanceOverview } from "./overview.queries";
import { useBucketLabel } from "./period-labels";

interface Row {
  key: string;
  label: string;
  long: string;
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
      <span className="font-medium">{row.long}</span>
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

/**
 * Income vs spending per bucket (month, quarter or year) in one currency, with a y-axis
 * and an in · out · net tooltip. Clicking a bar opens its transactions.
 */
const CashflowChart = ({
  currency,
  overview,
  search,
}: {
  currency: Currency;
  overview: FinanceOverview;
  search: OverviewSearch;
}) => {
  const { t, i18n } = useTranslation("finances");
  const navigate = useNavigate();
  const label = useBucketLabel();
  const locale = i18n.language === "mk" ? "mk-MK" : "en-GB";
  const series = overview.cashflow.find((entry) => entry.currency === currency);

  const compact = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
        notation: "compact",
      }),
    [locale]
  );

  const multiYear =
    overview.buckets[0]?.slice(0, 4) !== overview.buckets.at(-1)?.slice(0, 4);

  const rows: Row[] = overview.buckets.map((key, index) => {
    const bucket = series?.buckets[index];

    // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
    return {
      expense: toMajor(bucket?.expenseMinor ?? 0),
      income: toMajor(bucket?.incomeMinor ?? 0),
      key,
      label: label(key, "tick", multiYear),
      long: label(key, "long"),
      net: toMajor(bucket?.netMinor ?? 0),
    };
  });

  /** Opens the transactions behind the bar at `index`. */
  const open = (index: number) => {
    const key = overview.buckets[index];

    if (key !== undefined) {
      void navigate({
        search: transactionsSearchFor(search, bucketRange(key)),
        to: "/finances/transactions",
      });
    }
  };

  const config: ChartConfig = {
    expense: { color: "var(--chart-3)", label: t("overview.spending") },
    income: { color: "var(--chart-1)", label: t("overview.income") },
  };

  return (
    <ChartContainer
      aria-label={t("overview.chartLabelDesktop")}
      className="aspect-auto h-56 w-full [&_.recharts-bar-rectangle]:cursor-pointer"
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
          onClick={(_entry: BarRectangleItem, index: number) => {
            open(index);
          }}
          radius={[3, 3, 0, 0]}
        />
        <Bar
          dataKey="expense"
          fill="var(--color-expense)"
          onClick={(_entry: BarRectangleItem, index: number) => {
            open(index);
          }}
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
};

export default CashflowChart;
