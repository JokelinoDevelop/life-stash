import type { CalendarStatus } from "@shared/domain/fitness/schedule";

import type { NamedCalendarEntry } from "../calendar";

export interface GetCalendarResponse {
  today: string;
  entries: {
    key: string;
    id: string | null;
    scheduleId: string | null;
    originalDate: string | null;
    trainingId: string | null;
    name: string;
    date: string;
    status: CalendarStatus;
    durationMinutes: number | null;
    note: string | null;
  }[];
}

export const toGetCalendarResponse = (result: {
  today: string;
  entries: readonly NamedCalendarEntry[];
}): GetCalendarResponse => ({
  entries: result.entries.map((entry) => ({
    date: entry.date,
    durationMinutes: entry.durationMinutes,
    id: entry.id,
    key: entry.key,
    name: entry.name,
    note: entry.note,
    originalDate: entry.originalDate,
    scheduleId: entry.scheduleId,
    status: entry.status,
    trainingId: entry.trainingId,
  })),
  today: result.today,
});
