import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ListRow, ListSection } from "@/components/app/list-section";
import { StatusRing } from "@/components/app/status-ring";

import type { CalendarEntry } from "../fitness.queries";
import { localOfIso } from "./calendar-dates";

const MAX_ROWS = 6;

/** Desktop side column: the next planned sessions after the chosen day; a row selects its day. */
export const ComingUp = ({
  after,
  entries,
  onSelect,
}: {
  after: string;
  entries: readonly CalendarEntry[];
  onSelect: (day: string) => void;
}) => {
  const { t, i18n } = useTranslation("fitness");
  const locale = i18n.language === "mk" ? "mk-MK" : "en-GB";

  const dayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        weekday: "short",
      }),
    [locale]
  );

  const next = entries
    .filter((entry) => entry.status === "planned" && entry.date > after)
    .slice(0, MAX_ROWS);

  if (next.length === 0) {
    return null;
  }

  return (
    <ListSection className="hidden xl:flex" title={t("calendar.comingUp")}>
      {next.map((entry) => (
        <ListRow
          key={entry.key}
          render={
            <button
              aria-label={`${entry.name}, ${dayLabel.format(localOfIso(entry.date))}`}
              className="w-full text-left"
              onClick={() => {
                onSelect(entry.date);
              }}
              type="button"
            />
          }
        >
          <StatusRing label={null} status="upcoming" />
          <span className="flex min-w-0 flex-1 flex-col py-1.5">
            <span className="truncate font-medium">{entry.name}</span>
            <span className="text-muted-foreground truncate text-xs tabular-nums">
              {dayLabel.format(localOfIso(entry.date))}
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground/60 size-4 shrink-0"
          />
        </ListRow>
      ))}
    </ListSection>
  );
};
