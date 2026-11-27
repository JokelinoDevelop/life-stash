import type { BucketCashflow } from "@shared/domain/finances/cashflow";
import { bucketKey } from "@shared/domain/finances/period";
import type { Granularity } from "@shared/domain/finances/period";
import type { Currency } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { ScrubRange } from "@/components/app/scrub-range";
import { useScrub } from "@/components/app/use-scrub";
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useBucketLabel } from "./period-labels";

/** At most this many axis labels fit under the bars on a phone. */
const MAX_TICKS = 6;

/**
 * Phone: money in (dark) and out (light) per bucket of the period, with a few axis labels.
 * Tap or drag across the bars to read one; the current bucket (or the last) is read out
 * until then. Buckets after it are empty.
 */
export const NetBars = ({
  buckets,
  currency,
  granularity,
  today,
}: {
  buckets: readonly BucketCashflow[];
  currency: Currency;
  granularity: Granularity;
  today: string;
}) => {
  const current = buckets.findIndex(
    (bucket) => bucket.key === bucketKey(today, granularity)
  );

  const last = current === -1 ? Math.max(0, buckets.length - 1) : current;
  const { t } = useTranslation("finances");
  const format = useFormat();
  const label = useBucketLabel();
  const scrub = useScrub(buckets.length, last);
  const shown = scrub.selected ?? last;
  const bucket = buckets[shown];
  const step = Math.ceil(buckets.length / MAX_TICKS);

  const multiYear =
    buckets[0]?.key.slice(0, 4) !== buckets.at(-1)?.key.slice(0, 4);

  const highest = Math.max(
    1,
    ...buckets.map((entry) => Math.max(entry.incomeMinor, entry.expenseMinor))
  );

  const readout = t("overview.monthReadout", {
    expense: format.money(bucket?.expenseMinor ?? 0, currency),
    income: format.money(bucket?.incomeMinor ?? 0, currency),
    month: bucket === undefined ? "" : label(bucket.key, "long"),
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
        {buckets.map((entry, index) => (
          <span
            aria-hidden="true"
            className={cn(
              "flex h-full flex-1 items-end gap-px transition-opacity",
              scrub.selected !== null && index !== shown && "opacity-35"
            )}
            key={entry.key}
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
        {buckets.map((entry, index) => (
          <span
            className={cn(
              "min-w-0 flex-1 overflow-visible whitespace-nowrap",
              index === shown && "text-foreground font-semibold"
            )}
            key={entry.key}
          >
            {index % step === 0
              ? label(entry.key, "tick", multiYear && step > 1)
              : ""}
          </span>
        ))}
      </div>
      <p className="text-foreground text-xs font-medium tabular-nums">
        {readout}
      </p>
    </div>
  );
};
