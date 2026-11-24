import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

import { fitnessKeys } from "./fitness-keys";

export const fitnessOverviewQuery = queryOptions({
  queryFn: async () => await unwrap(api.fitness.overview.$get()),
  queryKey: fitnessKeys.overview,
  staleTime: 30_000,
});

export type FitnessOverview = SuccessBody<
  Awaited<ReturnType<typeof api.fitness.overview.$get>>
>;

export const calendarQuery = (from: string, to: string) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: async () =>
      await unwrap(api.fitness.sessions.calendar.$get({ query: { from, to } })),
    queryKey: fitnessKeys.calendar(from, to),
    staleTime: 30_000,
  });

export type CalendarEntry = SuccessBody<
  Awaited<ReturnType<typeof api.fitness.sessions.calendar.$get>>
>["entries"][number];

/** Active trainings, or every training (archived included). */
export const trainingsQuery = (archived: boolean) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(
        api.fitness.trainings.$get({
          query: archived ? { archived: "true" } : {},
        })
      ),
    queryKey: fitnessKeys.trainings(archived),
    staleTime: 60_000,
  });

export type Training = SuccessBody<
  Awaited<ReturnType<typeof api.fitness.trainings.$get>>
>["trainings"][number];

export const sessionQuery = (sessionId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(
        api.fitness.sessions[":sessionId"].$get({ param: { sessionId } })
      ),
    queryKey: fitnessKeys.session(sessionId),
  });

export type SessionDetail = SuccessBody<
  Awaited<ReturnType<(typeof api.fitness.sessions)[":sessionId"]["$get"]>>
>;

export const occurrenceQuery = (scheduleId: string, originalDate: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(
        api.fitness.sessions.occurrence.$get({
          query: { originalDate, scheduleId },
        })
      ),
    queryKey: fitnessKeys.occurrence(scheduleId, originalDate),
  });

export const lastNoteQuery = (trainingId: string, before: string) =>
  queryOptions({
    enabled: trainingId !== "",
    queryFn: async () =>
      await unwrap(
        api.fitness.sessions["last-note"].$get({
          query: { before, trainingId },
        })
      ),
    queryKey: fitnessKeys.lastNote(trainingId, before),
    staleTime: 60_000,
  });

export const weightQuery = (from: string, to: string) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: async () =>
      await unwrap(api.fitness.weight.$get({ query: { from, to } })),
    queryKey: fitnessKeys.weight(from, to),
    staleTime: 60_000,
  });

export type WeightEntry = SuccessBody<
  Awaited<ReturnType<typeof api.fitness.weight.$get>>
>["entries"][number];

export const fitnessSettingsQuery = queryOptions({
  queryFn: async () => await unwrap(api.fitness.settings.$get()),
  queryKey: fitnessKeys.settings,
  staleTime: 60_000,
});
