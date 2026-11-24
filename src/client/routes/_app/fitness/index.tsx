import { isIsoDate } from "@shared/domain/dates";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarCheck, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { HouseholdName } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/hooks/use-hotkey";
import { todayIso } from "@/lib/partial-date";
import { FITNESS_SHORTCUTS } from "@/lib/shortcuts";
import { cached, warm } from "@/lib/warm";
import { FitnessBrowseLinks } from "@/modules/fitness/browse-links";
import { calendarRange } from "@/modules/fitness/calendar/calendar-dates";
import { CalendarView } from "@/modules/fitness/calendar/calendar-view";
import { useFitnessDialog } from "@/modules/fitness/dialogs/use-fitness-dialog";
import {
  calendarQuery,
  fitnessOverviewQuery,
} from "@/modules/fitness/fitness.queries";

const MONTH = /^\d{4}-(?:0[1-9]|1[0-2])$/u;

const searchSchema = z.object({
  /** The selected day (absent: today). */
  day: z.string().refine(isIsoDate).optional().catch(undefined),
  /** The month shown (absent: the selected day's month). */
  month: z.string().regex(MONTH).optional().catch(undefined),
});

const FitnessPage = () => {
  const { t } = useTranslation("fitness");
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const dialog = useFitnessDialog();
  const today = todayIso();
  const day = search.day ?? today;
  const month = search.month ?? day.slice(0, 7);

  const onToday = day === today && month === today.slice(0, 7);

  const goToday = () => {
    void navigate({
      replace: true,
      search: ({ day: _day, month: _month, ...prev }) => prev,
    });
  };

  const addSession = () => {
    void dialog.open({ date: day, dialog: "session" });
  };

  const logWeight = () => {
    void dialog.open({ dialog: "weight" });
  };

  useHotkey(FITNESS_SHORTCUTS.addSession, addSession);
  useHotkey(FITNESS_SHORTCUTS.logWeight, logWeight);

  return (
    <>
      <PageHeader
        actions={
          <>
            {!onToday && (
              <>
                <Button
                  className="hidden md:inline-flex"
                  onClick={goToday}
                  size="compact"
                  variant="ghost"
                >
                  {t("calendar.todayButton")}
                </Button>
                <Button
                  aria-label={t("calendar.todayButton")}
                  className="md:hidden"
                  onClick={goToday}
                  size="icon-compact"
                  variant="ghost"
                >
                  <CalendarCheck />
                </Button>
              </>
            )}
            <Button
              className="hidden md:inline-flex"
              onClick={logWeight}
              size="compact"
              variant="outline"
            >
              {t("weight.add")}
            </Button>
            <Button
              className="hidden md:inline-flex"
              onClick={addSession}
              size="compact"
            >
              <Plus />
              {t("sessions.add")}
              <Kbd>{FITNESS_SHORTCUTS.addSession.toUpperCase()}</Kbd>
            </Button>
            <Button
              aria-label={t("sessions.add")}
              className="md:hidden"
              onClick={addSession}
              size="icon-compact"
              variant="ghost"
            >
              <Plus />
            </Button>
          </>
        }
        mobileTop={<HouseholdName className="-ml-1" />}
        title={t("title")}
      />
      <CalendarView
        day={day}
        month={month}
        onDayChange={(next) => {
          void navigate({
            replace: true,
            search: ({ day: _day, month: _month, ...prev }) =>
              next === today ? prev : { ...prev, day: next },
          });
        }}
        onMonthChange={(next) => {
          // The chosen day follows the month (its 1st; today in the current month), so the
          // day list never shows a day whose sessions aren't loaded.
          void navigate({
            replace: true,
            search: ({ day: _day, month: _month, ...prev }) =>
              next === today.slice(0, 7)
                ? prev
                : { ...prev, day: `${next}-01`, month: next },
          });
        }}
      />
      <div className="mt-6 md:mt-0">
        <FitnessBrowseLinks />
      </div>
    </>
  );
};

export const Route = createFileRoute("/_app/fitness/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ day: search.day, month: search.month }),
  loader: async ({ context: { queryClient }, deps }) => {
    const month = deps.month ?? (deps.day ?? todayIso()).slice(0, 7);
    const range = calendarRange(month);

    await warm(
      queryClient.query(cached(calendarQuery(range.from, range.to))),
      queryClient.query(cached(fitnessOverviewQuery))
    );
  },
  component: FitnessPage,
});
