import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/** The twelve month names in the user's language ("Jan" / "J" in English). */
export const useMonthNames = (style: "short" | "narrow") => {
  const { i18n } = useTranslation();

  return useMemo(() => {
    const format = new Intl.DateTimeFormat(
      i18n.language === "mk" ? "mk-MK" : "en-GB",
      { month: style, timeZone: "UTC" }
    );

    return Array.from({ length: 12 }, (_, index) =>
      format.format(new Date(Date.UTC(2026, index, 1)))
    );
  }, [i18n.language, style]);
};
