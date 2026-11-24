import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Plus } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ListRow, ListSection } from "@/components/app/list-section";
import { PageStack } from "@/components/app/page-header";
import { ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";

import { FitnessDialogLink } from "../dialogs/fitness-dialog-link";
import { useFitnessDialog } from "../dialogs/use-fitness-dialog";
import { calendarQuery, fitnessOverviewQuery } from "../fitness.queries";
import { FitnessStats } from "../overview/fitness-stats";
import { SessionRow } from "../sessions/session-row";
import { calendarRange, localOfIso } from "./calendar-dates";
import { ComingUp } from "./coming-up";
import { FitnessCalendar } from "./fitness-calendar";
import { QuickAdd } from "./quick-add";

const useDayTitle = (day: string, today: string) => {
  const { t, i18n } = useTranslation("fitness");
  const locale = i18n.language === "mk" ? "mk-MK" : "en-GB";

  const formats = useMemo(
    () => ({
      // Today drops the weekday so the heading fits the narrow day column.
      dayMonth: new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
      }),
      full: new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        weekday: "short",
      }),
    }),
    [locale]
  );

  const date = localOfIso(day);
  const label = formats.full.format(date);

  return {
    label,
    title:
      day === today
        ? t("calendar.today", { date: formats.dayMonth.format(date) })
        : label,
  };
};

/** Fitness home: week summary, the month calendar, and the chosen day's sessions. */
export const CalendarView = ({
  day,
  month,
  onDayChange,
  onMonthChange,
}: {
  day: string;
  month: string;
  onDayChange: (day: string) => void;
  onMonthChange: (month: string) => void;
}) => {
  const { t } = useTranslation("fitness");
  const range = calendarRange(month);
  const calendar = useQuery(calendarQuery(range.from, range.to));
  const overview = useQuery(fitnessOverviewQuery);
  const today = overview.data?.today ?? calendar.data?.today ?? day;
  const { label: dayLabel, title } = useDayTitle(day, today);
  const dialog = useFitnessDialog();

  if (calendar.isPending || overview.isPending) {
    return <LoadingState />;
  }

  if (calendar.isError || overview.isError) {
    return (
      <ErrorState
        error={calendar.error ?? overview.error}
        onRetry={() => {
          void calendar.refetch();
          void overview.refetch();
        }}
      />
    );
  }

  const { entries } = calendar.data;
  const ofDay = entries.filter((entry) => entry.date === day);

  return (
    <PageStack>
      <FitnessStats overview={overview.data} />
      {/* Desktop: the calendar fills the width, the chosen day sits beside it. */}
      <div
        className="flex flex-col gap-6 md:gap-0 xl:grid xl:grid-cols-[minmax(0,1fr)_18rem]"
        data-bleed=""
      >
        <section className="surface bg-card md:border-divider rounded-lg border p-2 md:rounded-none md:border-0 md:border-b md:px-5 md:pt-3 md:pb-5 xl:border-b-0">
          <FitnessCalendar
            entries={entries}
            month={month}
            onMonthChange={onMonthChange}
            onAdd={(date) => {
              void dialog.open({ date, dialog: "session" });
            }}
            onSelect={onDayChange}
            selected={day}
          />
        </section>
        <div className="xl:border-divider xl:border-l">
          <ListSection
            action={
              <Button
                nativeButton={false}
                render={
                  <FitnessDialogLink entry={{ date: day, dialog: "session" }} />
                }
                size="xs"
                variant="ghost"
              >
                <Plus />
                {t("sessions.add")}
              </Button>
            }
            count={ofDay.length}
            title={title}
          >
            {ofDay.length === 0 ? (
              <ListRow className="text-muted-foreground gap-2 text-sm">
                <CalendarDays className="size-4" />
                {t("calendar.nothing")}
              </ListRow>
            ) : (
              ofDay.map((entry) => (
                <SessionRow entry={entry} key={entry.key} today={today} />
              ))
            )}
            <QuickAdd day={day} dayLabel={dayLabel} today={today} />
          </ListSection>
          <ComingUp after={day} entries={entries} onSelect={onDayChange} />
        </div>
      </div>
    </PageStack>
  );
};
