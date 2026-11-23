import type { MonthCashflow } from "@shared/domain/finances/cashflow";
import type { Currency } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { ScrubRange } from "@/components/app/scrub-range";
import { useScrub } from "@/components/app/use-scrub";
import { useFormat } from "@/lib/format";
import { useMonthNames } from "@/lib/use-month-names";
import { cn } from "@/lib/utils";

/**
 * Phone: money in (dark) and out (light) per month, with month initials.
 * Tap or drag across the bars to read a month; the current month is read out
 * until then. Months after `last` are empty.
 */
export const NetBars = ({
  currency,
  months,
  today,
  year,
}: {
  currency: Currency;
  months: readonly MonthCashflow[];
  today: string;
  year: number;
}) => {
  // The latest month with data: this month, or December for past years.
  const last =
    Number(today.slice(0, 4)) === year ? Number(today.slice(5, 7)) - 1 : 11;

  const { t } = useTranslation("finances");
  const format = useFormat();
  const short = useMonthNames("short");
  const narrow = useMonthNames("narrow");
  const scrub = useScrub(12, last);
  const shown = scrub.selected ?? last;
  const month = months[shown];

  const highest = Math.max(
    1,
    ...months.map((entry) => Math.max(entry.incomeMinor, entry.expenseMinor))
  );

  const readout = t("overview.monthReadout", {
    expense: format.money(month?.expenseMinor ?? 0, currency),
    income: format.money(month?.incomeMinor ?? 0, currency),
    month: short[shown],
  });

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      <div
        className="relative flex h-16 cursor-pointer touch-pan-y items-end gap-1 select-none has-focus-visible:ring-2"
        {...scrub.bind}
      >
        <ScrubRange
          label={t("overview.chartLabel")}
          last={last}
          onChange={scrub.handleSelect}
          value={shown}
          valueText={readout}
        />
        {months.map((entry, index) => (
          <span
            aria-hidden="true"
            className={cn(
              "flex h-full flex-1 items-end gap-px transition-opacity",
              scrub.selected !== null && index !== shown && "opacity-35"
            )}
            key={entry.month}
          >
            <span
              className="bg-chart-1 h-(--bar) flex-1 rounded-t-sm"
              style={{ "--bar": `${(entry.incomeMinor / highest) * 100}%` }}
            />
            <span
              className="bg-chart-3 h-(--bar) flex-1 rounded-t-sm"
              style={{ "--bar": `${(entry.expenseMinor / highest) * 100}%` }}
            />
          </span>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="text-muted-foreground flex gap-1 text-center text-xs"
      >
        {narrow.map((name, index) => (
          <span
            className={cn(
              "flex-1",
              index === shown && "text-foreground font-semibold"
            )}
            // oxlint-disable-next-line react/no-array-index-key -- narrow names repeat (J, M, A)
            key={index}
          >
            {name}
          </span>
        ))}
      </div>
      <p className="text-foreground text-xs font-medium tabular-nums">
        {readout}
      </p>
    </div>
  );
};
