import type { CalendarStatus } from "@shared/domain/fitness/schedule";

import type { SessionDetail } from "../sessions.service";

export interface GetOccurrenceResponse {
  id: string | null;
  scheduleId: string | null;
  originalDate: string | null;
  trainingId: string | null;
  name: string;
  title: string | null;
  date: string;
  status: CalendarStatus;
  durationMinutes: number | null;
  note: string | null;
  previousNote: { date: string; note: string } | null;
}

export const toGetOccurrenceResponse = (
  detail: SessionDetail
): GetOccurrenceResponse => ({
  date: detail.date,
  durationMinutes: detail.durationMinutes,
  id: detail.id,
  name: detail.name,
  note: detail.note,
  originalDate: detail.originalDate,
  previousNote:
    detail.previousNote === null
      ? null
      : { date: detail.previousNote.date, note: detail.previousNote.note },
  scheduleId: detail.scheduleId,
  status: detail.status,
  title: detail.title,
  trainingId: detail.trainingId,
});
