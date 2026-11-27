import { wholeYear } from "@shared/domain/finances/period";
import { useTranslation } from "react-i18next";

import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { periodOf } from "./overview-search";
import type { OverviewSearch } from "./overview-search";

const formats = new Map<string, Intl.DateTimeFormat>();

const monthFormat = (
  locale: string,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat => {
  const key = `${locale}:${JSON.stringify(options)}`;
  let format = formats.get(key);

  if (format === undefined) {
    format = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });
    formats.set(key, format);
  }

  return format;
};

const capitalise = (text: string, locale: string) =>
  text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);

/**
 * Labels for chart buckets (`2026-03`, `2026-Q1`, `2026`):
 * `tick` for an axis ("Mar", or "Mar 25" when the chart spans years), `long` for tooltips.
 */
export const useBucketLabel = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language === "mk" ? "mk-MK" : "en-GB";

  return (key: string, style: "long" | "tick", multiYear = false): string => {
    const year = key.slice(0, 4);

    if (key.length === 4) {
      return year;
    }

    if (key.includes("Q")) {
      const quarter = key.slice(5);

      if (style === "long") {
        return `${quarter} ${year}`;
      }

      return `${quarter} ’${year.slice(2)}`;
    }

    const date = new Date(`${key}-01T00:00:00Z`);

    if (style === "long") {
      return capitalise(
        monthFormat(locale, { month: "long", year: "numeric" }).format(date),
        locale
      );
    }

    const month = capitalise(
      monthFormat(locale, { month: "short" }).format(date),
      locale
    );

    return multiYear ? `${month} ’${year.slice(2)}` : month;
  };
};

/** The search's period: "All time", "Last 12 months", "2026" or "01.03.2026 – 31.03.2026". */
export const usePeriodLabel = () => {
  const { t } = useTranslation("finances");
  const format = useFormat();

  return (search: OverviewSearch): string => {
    const period = periodOf(search, todayIso());

    if (period === null) {
      return t("overview.period.all");
    }

    if (search.from === undefined && search.year === undefined) {
      return t("overview.period.last12");
    }

    const year = wholeYear(period);

    return year === null
      ? `${format.date(period.from)} – ${format.date(period.to)}`
      : String(year);
  };
};
