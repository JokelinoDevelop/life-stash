import type { ReminderKind } from "@shared/domain/garage-kinds";

export interface GetReminderResponse {
  reminder: {
    id: string;
    carId: string;
    kind: ReminderKind;
    title: string;
    dueDate: string | null;
    dueOdometerKm: number | null;
    intervalMonths: number | null;
    intervalKm: number | null;
    notes: string | null;
    completedAt: string | null;
  };
}
