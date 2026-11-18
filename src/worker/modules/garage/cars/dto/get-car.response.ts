import type { DatePrecision } from "@shared/domain/dates";
import type { Currency } from "@shared/domain/money";

import type { garageCars } from "../../../../db/schema/garage";

export interface GetCarResponse {
  car: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    year: number | null;
    plate: string | null;
    vin: string | null;
    fuelType: string | null;
    color: string | null;
    purchaseDate: string | null;
    purchaseDatePrecision: DatePrecision | null;
    purchaseOdometerKm: number | null;
    purchasePriceMinor: number | null;
    purchaseCurrency: Currency | null;
    notes: string | null;
    soldDate: string | null;
    archivedAt: string | null;
    createdAt: string;
  };
}

export const toGetCarResponse = (
  row: typeof garageCars.$inferSelect
): GetCarResponse => ({
  car: {
    archivedAt: row.archivedAt,
    color: row.color,
    createdAt: row.createdAt,
    fuelType: row.fuelType,
    id: row.id,
    make: row.make,
    model: row.model,
    name: row.name,
    notes: row.notes,
    plate: row.plate,
    purchaseCurrency: row.purchaseCurrency,
    purchaseDate: row.purchaseDate,
    purchaseDatePrecision: row.purchaseDatePrecision,
    purchaseOdometerKm: row.purchaseOdometerKm,
    purchasePriceMinor: row.purchasePriceMinor,
    soldDate: row.soldDate,
    vin: row.vin,
    year: row.year,
  },
});
