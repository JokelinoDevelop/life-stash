import type { FitnessDialogTarget } from "../dialogs/fitness-dialog-search";
import type { SessionStatus } from "./session-status";

export interface SessionRowEntry {
  key: string;
  id: string | null;
  scheduleId: string | null;
  originalDate: string | null;
  name: string;
  date: string;
  status: SessionStatus;
  durationMinutes: number | null;
  note?: string | null;
}

/** The dialog a row opens: the stored session, or the untouched weekly occurrence. */
export const sessionTarget = (entry: SessionRowEntry): FitnessDialogTarget =>
  entry.id === null && entry.scheduleId !== null && entry.originalDate !== null
    ? {
        date: entry.originalDate,
        dialog: "session",
        schedule: entry.scheduleId,
      }
    : { dialog: "session", id: entry.id ?? undefined };
