import { queryOptions } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";

export const remindersQuery = (carId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(api.garage.reminders.$get({ query: { carId } })),
    queryKey: ["garage", "reminders", "list", carId] as const,
  });

export const reminderQuery = (reminderId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(
        api.garage.reminders[":reminderId"].$get({ param: { reminderId } })
      ),
    queryKey: ["garage", "reminders", "detail", reminderId] as const,
  });

export type RemindersList = SuccessBody<
  Awaited<ReturnType<typeof api.garage.reminders.$get>>
>;

export type ActiveReminder = RemindersList["active"][number];

export type CompletedReminder = RemindersList["completed"][number];

export type ReminderDetail = SuccessBody<
  Awaited<ReturnType<(typeof api.garage.reminders)[":reminderId"]["$get"]>>
>;
