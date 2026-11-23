import type { MoneyTotal } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { Money } from "@/components/app/money";
import { cn } from "@/lib/utils";

import type { MonthSummary } from "./group-by-month";
import { netByCurrency } from "./group-by-month";

const monthFormats = new Map<string, Intl.DateTimeFormat>();

/** "November 2026" in the user's language. */
export const useMonthLabel = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language === "mk" ? "mk-MK" : "en-GB";

  return (month: string, withYear = true): string => {
    const key = `${locale}:${withYear}`;
    let format = monthFormats.get(key);

    if (format === undefined) {
      format = new Intl.DateTimeFormat(
        locale,
        withYear
          ? { month: "long", timeZone: "UTC", year: "numeric" }
          : { month: "long", timeZone: "UTC" }
      );
      monthFormats.set(key, format);
    }

    const label = format.format(new Date(`${month}-01T00:00:00Z`));

    return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1);
  };
};

/** Amounts per currency: " · " between them on desktop, stacked on phones. */
const Totals = ({
  sign,
  stack = false,
  totals,
}: {
  sign: "+" | "−" | "±";
  stack?: boolean;
  totals: readonly MoneyTotal[];
}) => {
  if (totals.length === 0) {
    return <span>—</span>;
  }

  return (
    <span
      className={cn(
        stack && "max-md:inline-flex max-md:flex-col max-md:items-end"
      )}
    >
      {totals.map((total, index) => {
        let prefix: string = sign;

        if (sign === "±") {
          prefix = total.amountMinor < 0 ? "−" : "+";
        }

        return (
          <span
            className={cn(
              sign === "±" &&
                (total.amountMinor < 0 ? "text-destructive" : "text-foreground")
            )}
            key={total.currency}
          >
            {index > 0 && (
              <span className={cn(stack && "max-md:hidden")}> · </span>
            )}
            <Money
              amountMinor={total.amountMinor}
              currency={total.currency}
              sign={prefix === "+" ? "+" : "−"}
            />
          </span>
        );
      })}
    </span>
  );
};

/** A month heading: name and count; desktop adds money in, out and net for the whole month. */
export const MonthBand = ({
  month,
  summary,
}: {
  month: string;
  summary: MonthSummary | undefined;
}) => {
  const { t } = useTranslation("finances");
  const label = useMonthLabel();
  const net = summary === undefined ? [] : netByCurrency(summary);

  return (
    <div className="md:bg-background md:border-divider flex items-baseline gap-3 px-0.5 pb-2 text-sm md:h-8 md:items-center md:border-b md:px-5 md:pb-0 md:text-xs">
      <h2 className="text-subtle-foreground shrink-0 font-semibold whitespace-nowrap md:font-medium">
        {label(month)}
      </h2>
      {summary !== undefined && (
        <>
          <span className="text-muted-foreground hidden tabular-nums md:inline">
            {summary.entries}
          </span>
          <span className="flex-1" />
          <span className="text-muted-foreground hidden tabular-nums md:inline">
            {t("transactions.in")}{" "}
            <span className="text-success-foreground font-medium">
              <Totals sign="+" totals={summary.income} />
            </span>
          </span>
          <span className="text-muted-foreground hidden tabular-nums md:inline">
            {t("transactions.out")}{" "}
            <span className="text-foreground font-medium">
              <Totals sign="−" totals={summary.expense} />
            </span>
          </span>
          <span className="text-muted-foreground flex items-baseline gap-1 text-right tabular-nums max-md:text-xs md:inline md:min-w-24">
            {t("transactions.net")}{" "}
            <span className="font-semibold max-md:text-sm">
              <Totals sign="±" stack totals={net} />
            </span>
          </span>
        </>
      )}
    </div>
  );
};
