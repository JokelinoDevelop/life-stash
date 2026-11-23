import { useQuery } from "@tanstack/react-query";
import { Fragment } from "react";
import type { ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Money } from "@/components/app/money";
import { todayIso } from "@/lib/partial-date";
import { overviewQuery } from "@/modules/finances/overview/overview.queries";
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

/**
 * Phones: the line under Today's title — what is overdue (red), what is due
 * soon, and how much money is waiting on invoices.
 */
export const TodaySummaryLine = () => {
  const { t } = useTranslation("today");
  const year = Number(todayIso().slice(0, 4));
  const household = useQuery(householdOverviewQuery);
  const finances = useQuery(overviewQuery(year));

  if (household.data === undefined || finances.data === undefined) {
    return null;
  }

  const summary = summarizeToday(
    household.data.reminders,
    finances.data.waiting,
    household.data.today
  );

  const parts: { key: string; node: ReactNode }[] = [];

  if (summary.overdue > 0) {
    parts.push({
      key: "overdue",
      node: (
        <span className="text-destructive font-medium">
          {t("hero.overdue", { count: summary.overdue })}
        </span>
      ),
    });
  }

  if (summary.dueSoon > 0) {
    parts.push({
      key: "soon",
      node: t("hero.dueSoon", { count: summary.dueSoon }),
    });
  }

  for (const total of summary.waiting) {
    parts.push({
      key: total.currency,
      node: (
        <span className="text-foreground font-medium">
          <Trans
            components={{
              money: (
                <Money
                  amountMinor={total.amountMinor}
                  currency={total.currency}
                />
              ),
            }}
            i18nKey="hero.waiting"
            t={t}
          />
        </span>
      ),
    });
  }

  if (parts.length === 0) {
    return <>{t("hero.clear")}</>;
  }

  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={part.key}>
          {index > 0 && " · "}
          {part.node}
        </Fragment>
      ))}
    </>
  );
};
