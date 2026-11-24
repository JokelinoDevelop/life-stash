import { WEEKDAYS } from "@shared/domain/fitness/schedule";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/** 2 Nov 2026 is a Monday: day `n` of that week is ISO weekday `n`. */
const mondayUtc = (weekday: number) =>
  new Date(Date.UTC(2026, 10, 1 + weekday));

/** Localised weekday names by ISO weekday (1 = Monday): short ("Mon") and narrow ("M"). */
export const useWeekdayNames = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language === "mk" ? "mk-MK" : "en-GB";

  return useMemo(() => {
    const short = new Intl.DateTimeFormat(locale, {
      timeZone: "UTC",
      weekday: "short",
    });

    const names = new Map<number, string>(
      WEEKDAYS.map((day) => [day, short.format(mondayUtc(day))])
    );

    return {
      /** "Mon · Thu" for a list of ISO weekdays. */
      list: (weekdays: readonly number[]) =>
        weekdays.map((day) => names.get(day) ?? "").join(" · "),
      short: (weekday: number) => names.get(weekday) ?? "",
    };
  }, [locale]);
};
