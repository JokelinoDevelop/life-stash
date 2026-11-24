import type { LastNote } from "../sessions.service";

export interface GetLastNoteResponse {
  previousNote: { date: string; note: string } | null;
}

export const toGetLastNoteResponse = (
  note: LastNote | null
): GetLastNoteResponse => ({
  previousNote: note === null ? null : { date: note.date, note: note.note },
});
