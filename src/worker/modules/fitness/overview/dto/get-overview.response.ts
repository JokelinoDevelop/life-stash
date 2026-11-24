import type { CalendarStatus } from "@shared/domain/fitness/schedule";

import type { FitnessOverview } from "../overview.service";

export interface GetFitnessOverviewResponse {
  today: string;
  week: { done: number; scheduled: number };
  streakWeeks: number;
  todaySessions: {
    key: string;
    id: string | null;
    scheduleId: string | null;
    originalDate: string | null;
    trainingId: string | null;
    name: string;
    date: string;
    status: CalendarStatus;
    durationMinutes: number | null;
  }[];
  weight: {
    latest: { date: string; weightGrams: number } | null;
    change7Grams: number | null;
    change30Grams: number | null;
  };
}

export const toGetFitnessOverviewResponse = (
  overview: FitnessOverview
): GetFitnessOverviewResponse => ({
  streakWeeks: overview.streakWeeks,
  today: overview.today,
  todaySessions: overview.todaySessions.map((entry) => ({
    date: entry.date,
    durationMinutes: entry.durationMinutes,
    id: entry.id,
    key: entry.key,
    name: entry.name,
    originalDate: entry.originalDate,
    scheduleId: entry.scheduleId,
    status: entry.status,
    trainingId: entry.trainingId,
  })),
  week: { done: overview.week.done, scheduled: overview.week.scheduled },
  weight: {
    change30Grams: overview.weight.change30Grams,
    change7Grams: overview.weight.change7Grams,
    latest:
      overview.weight.latest === null
        ? null
        : {
            date: overview.weight.latest.date,
            weightGrams: overview.weight.latest.weightGrams,
          },
  },
});
