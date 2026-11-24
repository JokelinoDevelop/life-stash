import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Plus } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ListRow, ListSection, Panel } from "@/components/app/list-section";
import { PageStack } from "@/components/app/page-header";
import { ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";

import { FitnessDialogLink } from "../dialogs/fitness-dialog-link";
import { calendarQuery, fitnessOverviewQuery } from "../fitness.queries";
import { FitnessStats } from "../overview/fitness-stats";
import { SessionRow } from "../sessions/session-row";
import { calendarRange, localOfIso } from "./calendar-dates";
import { FitnessCalendar } from "./fitness-calendar";

const useDayTitle = (day: string, today: string) => {
  const { t, i18n } = useTranslation("fitness");
  const locale = i18n.language === "mk" ? "mk-MK" : "en-GB";

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        weekday: "short",
      }),
    [locale]
  );

  const label = formatter.format(localOfIso(day));

  if (day === today) {
    return t("calendar.today", { date: label });
  }

  return label;
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
  const title = useDayTitle(day, today);

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
      <Panel className="p-2 md:max-w-md md:p-3">
        <FitnessCalendar
          entries={entries}
          month={month}
          onMonthChange={onMonthChange}
          onSelect={onDayChange}
          selected={day}
        />
      </Panel>
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
      </ListSection>
    </PageStack>
  );
};
