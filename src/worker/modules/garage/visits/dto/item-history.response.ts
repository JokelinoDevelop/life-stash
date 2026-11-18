import type { DatePrecision } from "@shared/domain/dates";

export interface ItemHistoryResponse {
  items: {
    itemId: string;
    name: string;
    lastDate: string;
    lastDatePrecision: DatePrecision;
    lastOdometerKm: number | null;
    byPreviousOwner: boolean;
    visitId: string;
    timesDone: number;
  }[];
}
