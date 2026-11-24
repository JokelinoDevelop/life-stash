import { createContext, use, useMemo } from "react";
import type { ComponentProps } from "react";
import { enGB, mk } from "react-day-picker/locale";
import { useTranslation } from "react-i18next";

import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import type { SessionStatus } from "../sessions/session-status";
import { isoOfLocal, localOfIso } from "./calendar-dates";

interface DayItem {
  name: string;
  status: SessionStatus;
}

const DayItems = createContext<ReadonlyMap<string, DayItem[]>>(new Map());

/** Status as a mark: filled when it happened (done, missed), a ring when it's ahead or skipped. */
const MARK: Record<SessionStatus, string> = {
  done: "bg-success",
  missed: "bg-destructive",
  planned: "border-primary border",
  skipped: "border-muted-foreground border",
};

const MAX_DOTS = 3;
const MAX_NAMES = 3;

/** Phones: up to three status dots under the number. */
const Dots = ({ items }: { items: readonly DayItem[] }) => (
  <span
    aria-hidden="true"
    className="flex h-1.5 items-center gap-0.5 md:hidden"
  >
    {items.slice(0, MAX_DOTS).map((item, index) => (
      <span
        className={cn("size-1.5 rounded-full", MARK[item.status])}
        // Dots of the same status are interchangeable.
        // oxlint-disable-next-line react/no-array-index-key
        key={`${item.status}-${index}`}
      />
    ))}
  </span>
);

/** Desktop: the day's sessions by name, each with its status mark; "+2" when more. */
const Names = ({ items }: { items: readonly DayItem[] }) => {
  const { t } = useTranslation("fitness");
  const hidden = items.length - MAX_NAMES;

  return (
    <span
      aria-hidden="true"
      className="hidden min-w-0 flex-col gap-0.5 !opacity-100 md:flex"
    >
      {items.slice(0, MAX_NAMES).map((item, index) => (
        <span
          className={cn(
            "bg-background text-foreground in-data-[outside=true]:text-muted-foreground flex min-w-0 items-center gap-1 rounded-sm px-1 py-0.5 text-xs font-normal",
            item.status === "skipped" && "text-muted-foreground line-through",
            item.status === "missed" && "text-destructive"
          )}
          // Names can repeat on one day; order is stable.
          // oxlint-disable-next-line react/no-array-index-key
          key={`${item.name}-${index}`}
        >
          <span
            className={cn("size-1.5 shrink-0 rounded-full", MARK[item.status])}
          />
          <span className="truncate">{item.name}</span>
        </span>
      ))}
      {hidden > 0 && (
        <span className="text-muted-foreground px-1 text-xs font-normal">
          {t("calendar.more", { count: hidden })}
        </span>
      )}
    </span>
  );
};

/** A day cell: the number, then the day's sessions (dots on phones, names on desktop). */
const FitnessDayButton = (props: ComponentProps<typeof CalendarDayButton>) => {
  const { children, day } = props;
  const items = use(DayItems).get(isoOfLocal(day.date)) ?? [];

  return (
    <CalendarDayButton {...props}>
      <span className="md:px-0.5 md:text-sm md:!opacity-100">{children}</span>
      <Dots items={items} />
      <Names items={items} />
    </CalendarDayButton>
  );
};

/** The month grid (Monday first) with each day's sessions; picking a day selects it. */
export const FitnessCalendar = ({
  entries,
  month,
  onMonthChange,
  onSelect,
  selected,
}: {
  entries: readonly (DayItem & { date: string })[];
  month: string;
  onMonthChange: (month: string) => void;
  onSelect: (day: string) => void;
  selected: string;
}) => {
  const { i18n } = useTranslation();

  const items = useMemo(() => {
    const byDay = new Map<string, DayItem[]>();

    for (const entry of entries) {
      byDay.set(entry.date, [
        ...(byDay.get(entry.date) ?? []),
        { name: entry.name, status: entry.status },
      ]);
    }

    return byDay;
  }, [entries]);

  return (
    <DayItems value={items}>
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
    </DayItems>
  );
};
