import { useTranslation } from "react-i18next";

import { Money } from "@/components/app/money";
import { ScrubRange } from "@/components/app/scrub-range";
import { useScrub } from "@/components/app/use-scrub";
import { useFormat } from "@/lib/format";
import { useMonthNames } from "@/lib/use-month-names";
import { cn } from "@/lib/utils";

import type { CarListItem } from "../cars/car-row";
import type { HouseholdMoney } from "./household-money";
import { carColor, percentChange } from "./household-money";

export const Change = ({
  money,
  year,
}: {
  money: HouseholdMoney;
  year: number;
}) => {
  const { t } = useTranslation("garage");
  const change = percentChange(money);

  if (change === null) {
    return null;
  }

  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        change <= 0 ? "text-success" : "text-destructive"
      )}
    >
      {t("home.vsLastYear", {
        change: `${change > 0 ? "+" : "−"}${Math.abs(change)}%`,
        year: year - 1,
      })}
    </span>
  );
};

/** Phones: this year's household spending with a bar per month. */
export const SpentCard = ({
  money,
  monthIndex,
  year,
}: {
  money: HouseholdMoney;
  monthIndex: number;
  year: number;
}) => {
  const { t } = useTranslation("garage");
  const format = useFormat();
  const names = useMonthNames("short");
  const peak = Math.max(1, ...money.months);
  const scrub = useScrub(12, monthIndex);
  const shown = scrub.selected ?? monthIndex;

  return (
    <section className="surface bg-card rounded-lg border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-muted-foreground text-xs font-medium">
          {t("home.spentThisYear", { year })}
        </span>
        <Change money={money} year={year} />
      </div>
      <p className="mt-1 text-4xl font-semibold tracking-tight">
        <Money amountMinor={money.thisYear} currency={money.currency} />
      </p>
      <div
        className="border-divider relative mt-4 flex h-16 cursor-pointer touch-pan-y items-end gap-1 border-b select-none has-focus-visible:ring-2"
        {...scrub.bind}
      >
        <ScrubRange
          label={t("home.chartLabel")}
          last={monthIndex}
          onChange={scrub.handleSelect}
          value={shown}
          valueText={`${names[shown]} ${format.money(money.months[shown] ?? 0, money.currency)}`}
        />
        {money.months.map((amount, index) => (
          <span
            className={cn(
              "h-(--bar) flex-1 rounded-t-xs transition-colors",
              index === shown ? "bg-primary" : "bg-chart-4"
            )}
            aria-hidden="true"
            key={names[index]}
            style={{
              "--bar": `${index > monthIndex ? 0 : Math.max(2, (amount / peak) * 100)}%`,
            }}
          />
        ))}
      </div>
      <div className="text-muted-foreground mt-1.5 flex justify-between text-xs tabular-nums">
        <span>{names[0]}</span>
        <span>{names[3]}</span>
        <span>{names[6]}</span>
        <span>{names[9]}</span>
        <span className="text-foreground font-medium">
          {names[shown]}{" "}
          <Money
            amountMinor={money.months[shown] ?? 0}
            currency={money.currency}
          />
        </span>
      </div>
    </section>
  );
};

/** Desktop: monthly spending stacked per car, with a legend. */
export const SpendingByMonth = ({
  cars,
  money,
  monthIndex,
}: {
  cars: readonly CarListItem[];
  money: HouseholdMoney;
  monthIndex: number;
}) => {
  const { t } = useTranslation("garage");
  const names = useMonthNames("short");
  const peak = Math.max(1, ...money.months);
  const shown = cars.filter((car) => money.carMonths.has(car.id));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold">{t("home.spendingByMonth")}</h2>
        <span className="flex-1" />
        {shown.map((car, index) => (
          <span
            className="text-subtle-foreground flex items-center gap-1.5 text-xs"
            key={car.id}
          >
            <span className={cn("size-2 rounded-xs", carColor(index))} />
            {car.name}
          </span>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="border-divider relative flex h-32 gap-3 border-b"
      >
        <span className="border-divider absolute inset-x-0 top-0 border-t" />
        <span className="border-divider absolute inset-x-0 top-1/3 border-t" />
        <span className="border-divider absolute inset-x-0 top-2/3 border-t" />
        {money.months.map((_, monthNumber) => (
          <div
            className="relative flex flex-1 flex-col-reverse items-center"
            key={names[monthNumber]}
          >
            {shown.map((car, index) => (
              <span
                className={cn(
                  "h-(--bar) w-full max-w-5 last:rounded-t-xs",
                  carColor(index)
                )}
                key={car.id}
                style={{
                  "--bar": `${((money.carMonths.get(car.id)?.[monthNumber] ?? 0) / peak) * 100}%`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="text-muted-foreground -mt-2 flex gap-3 text-center text-xs tabular-nums">
        {names.map((name, index) => (
          <span
            className={cn(
              "flex-1",
              index === monthIndex && "text-foreground font-medium"
            )}
            key={name}
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
};
