import type { Currency } from "@shared/domain/money";

export interface HouseholdSpendingResponse {
  cars: {
    carId: string;
    carName: string;
    archived: boolean;
    years: {
      year: number;
      currency: Currency;
      maintenanceMinor: number;
      otherMinor: number;
    }[];
  }[];
}
