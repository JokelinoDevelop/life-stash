import type { OdometerSource } from "../../odometer";

export interface ListMileageResponse {
  points: {
    id: string;
    date: string;
    odometerKm: number;
    source: OdometerSource;
    notes: string | null;
  }[];
}
