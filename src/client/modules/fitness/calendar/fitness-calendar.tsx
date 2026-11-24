import { createContext, use, useMemo } from "react";
import type { ComponentProps } from "react";
import { enGB, mk } from "react-day-picker/locale";
import { useTranslation } from "react-i18next";

import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import type { SessionStatus } from "../sessions/session-status";
import { isoOfLocal, localOfIso } from "./calendar-dates";

const DayStatuses = createContext<ReadonlyMap<string, SessionStatus[]>>(
  new Map()
);

/** Status as a dot: filled when it happened (done, missed), a ring when it's ahead or skipped. */
const DOT: Record<SessionStatus, string> = {
  done: "bg-success",
  missed: "bg-destructive",
  planned: "border-primary border",
  skipped: "border-muted-foreground border",
};

const MAX_DOTS = 3;

/** A day cell with up to three status dots under the number. */
const FitnessDayButton = (props: ComponentProps<typeof CalendarDayButton>) => {
  const { children, day } = props;
  const statuses = use(DayStatuses).get(isoOfLocal(day.date)) ?? [];

  return (
    <CalendarDayButton {...props}>
      {children}
      <span aria-hidden="true" className="flex h-1.5 items-center gap-0.5">
        {statuses.slice(0, MAX_DOTS).map((status, index) => (
          <span
            className={cn(
              "size-1.5 rounded-full in-data-[selected-single=true]:border-current",
              DOT[status]
            )}
            // Dots of the same status are interchangeable.
            // oxlint-disable-next-line react/no-array-index-key
            key={`${status}-${index}`}
          />
        ))}
      </span>
    </CalendarDayButton>
  );
};

/** The month grid (Monday first) with each day's sessions as dots; picking a day selects it. */
export const FitnessCalendar = ({
  entries,
  month,
  onMonthChange,
  onSelect,
  selected,
}: {
  entries: readonly { date: string; status: SessionStatus }[];
  month: string;
  onMonthChange: (month: string) => void;
  onSelect: (day: string) => void;
  selected: string;
}) => {
  const { i18n } = useTranslation();

  const statuses = useMemo(() => {
    const byDay = new Map<string, SessionStatus[]>();

    for (const entry of entries) {
      byDay.set(entry.date, [...(byDay.get(entry.date) ?? []), entry.status]);
    }

    return byDay;
  }, [entries]);

  return (
    <DayStatuses value={statuses}>
      <Calendar
        components={{ DayButton: FitnessDayButton }}
        locale={i18n.language === "mk" ? mk : enGB}
        mode="single"
        month={localOfIso(`${month}-01`)}
        onMonthChange={(date) => {
          onMonthChange(isoOfLocal(date).slice(0, 7));
        }}
        onSelect={(date) => {
          if (date !== undefined) {
            onSelect(isoOfLocal(date));
          }
        }}
        required
        selected={localOfIso(selected)}
        variant="month"
        weekStartsOn={1}
      />
    </DayStatuses>
  );
};
