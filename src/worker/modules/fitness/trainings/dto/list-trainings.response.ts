import type { TrainingWithWeekdays } from "../trainings.service";

export interface ListTrainingsResponse {
  trainings: {
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number | null;
    weekdays: number[];
    archived: boolean;
  }[];
}

export const toListTrainingsResponse = (
  rows: readonly TrainingWithWeekdays[]
): ListTrainingsResponse => ({
  trainings: rows.map((row) => ({
    archived: row.archivedAt !== null,
    description: row.description,
    durationMinutes: row.durationMinutes,
    id: row.id,
    name: row.name,
    weekdays: row.weekdays,
  })),
});
