import type { ReminderKind } from "@shared/domain/garage-kinds";

export interface GetReminderResponse {
  reminder: {
    id: string;
    carId: string;
    kind: ReminderKind;
    title: string;
    packageId: string | null;
    itemId: string | null;
    dueDate: string | null;
    dueOdometerKm: number | null;
    intervalMonths: number | null;
    intervalKm: number | null;
    notes: string | null;
    completedAt: string | null;
  };
  /** Catalog items implied by the reminder's package or item, for prefilling a service entry. */
  suggestedItems: { itemId: string; label: string }[];
}
