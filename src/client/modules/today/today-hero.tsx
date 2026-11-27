import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { todayIso } from "@/lib/partial-date";
import { overviewQuery } from "@/modules/finances/overview/overview.queries";
import { useSummaryTotals } from "@/modules/finances/use-summary-totals";
import { householdOverviewQuery } from "@/modules/garage/household/household.queries";

import { summarizeToday } from "./today-groups";

const dateFormats = new Map<string, Intl.DateTimeFormat>();

/** "Monday, 23 November" in the user's language. */
export const useTodayLabel = (): string => {
  const { i18n } = useTranslation();
  const locale = i18n.language === "mk" ? "mk-MK" : "en-GB";
  let format = dateFormats.get(locale);

  if (format === undefined) {
    format = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
      weekday: "long",
    });
    dateFormats.set(locale, format);
  }

  const label = format.format(new Date(`${todayIso()}T00:00:00Z`));

  return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1);
};

const tileClass =
  "surface bg-card flex min-w-0 flex-col rounded-lg border px-2.5 py-2.5";

/**
 * Phones: Today's summary as three tiles (overdue, due soon, money waiting) instead of a
 * sentence that wraps; the money tile opens the unpaid invoices.
 */
export const TodayStatTiles = () => {
  const { t } = useTranslation("today");
  const household = useQuery(householdOverviewQuery);
  const finances = useQuery(overviewQuery());
  const totals = useSummaryTotals();

  if (household.data === undefined || finances.data === undefined) {
    return null;
  }

  const summary = summarizeToday(
    household.data.reminders,
    finances.data.waiting,
    household.data.today
  );

  if (
    summary.overdue === 0 &&
    summary.dueSoon === 0 &&
    summary.waiting.length === 0
  ) {
    return null;
  }

  return (
    <div className="-mt-2 mb-6 grid grid-cols-[auto_auto_minmax(0,1fr)] gap-2 md:hidden">
      <div className={tileClass}>
        <span
          className={
            summary.overdue > 0
              ? "text-destructive text-lg font-semibold tabular-nums"
              : "text-lg font-semibold tabular-nums"
          }
        >
          {summary.overdue}
        </span>
        <span className="text-muted-foreground text-xs">
          {t("tiles.overdue")}
        </span>
      </div>
      <div className={tileClass}>
        <span className="text-lg font-semibold tabular-nums">
          {summary.dueSoon}
        </span>
        <span className="text-muted-foreground text-xs">
          {t("tiles.dueSoon")}
        </span>
      </div>
      {summary.waiting.length > 0 ? (
        <Link
          className={`${tileClass} active:bg-accent`}
          search={{ status: "unpaid" }}
          to="/finances/invoices"
        >
          <span className="truncate text-lg font-semibold tabular-nums">
            {totals(summary.waiting, { compact: true })}
          </span>
          <span className="text-muted-foreground text-xs">
            {t("tiles.waiting")}
          </span>
        </Link>
      ) : (
        <div className={tileClass}>
          <span className="text-lg font-semibold">—</span>
          <span className="text-muted-foreground text-xs">
            {t("tiles.waiting")}
          </span>
        </div>
      )}
    </div>
  );
};
