import type { Currency, MoneyTotal } from "@shared/domain/money";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Panel } from "@/components/app/list-section";
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

const MONTH_INITIALS = 12;

/** Twelve small bars: income from one client per month, in its own currency. */
export const EarnedByMonth = ({
  currency,
  months,
}: {
  currency: Currency;
  months: readonly { month: number; totals: MoneyTotal[] }[];
}) => {
  const { t, i18n } = useTranslation("finances");
  const format = useFormat();

  const amounts = months.map(
    (entry) =>
      entry.totals.find((total) => total.currency === currency)?.amountMinor ??
      0
  );

  const highest = Math.max(1, ...amounts);

  const initials = useMemo(() => {
    const narrow = new Intl.DateTimeFormat(
      i18n.language === "mk" ? "mk-MK" : "en-GB",
      {
        month: "narrow",
        timeZone: "UTC",
      }
    );

    return Array.from({ length: MONTH_INITIALS }, (_, index) =>
      narrow.format(new Date(Date.UTC(2026, index, 1)))
    );
  }, [i18n.language]);

  const label = amounts
    .map(
      (amount, index) => `${initials[index]}: ${format.money(amount, currency)}`
    )
    .join(", ");

  return (
    <Panel title={t("clients.earnedPerMonth")}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="flex h-24 items-end gap-1">
        {amounts.map((amount, index) => (
          <span
            className="flex h-full flex-1 flex-col justify-end"
            key={initials[index] + String(index)}
          >
            <span
              className={cn(
                "h-(--bar) rounded-t-sm",
                amount > 0 ? "bg-chart-1" : "bg-muted"
              )}
              style={{ "--bar": `${Math.max(4, (amount / highest) * 100)}%` }}
            />
          </span>
        ))}
      </div>
      <div className="text-muted-foreground mt-1.5 flex gap-1 text-xs tabular-nums">
        {initials.map((initial, index) => (
          <span
            className="flex-1 text-center"
            key={`${initial}${String(index)}`}
          >
            {initial}
          </span>
        ))}
      </div>
    </Panel>
  );
};
