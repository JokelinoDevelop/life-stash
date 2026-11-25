import type { DatePrecision } from "@shared/domain/dates";
import type { VisitKind } from "@shared/domain/garage-kinds";
import type { Currency } from "@shared/domain/money";
import { toMinor } from "@shared/domain/money";

import {
  garageServiceVisitItems,
  garageServiceVisits,
} from "../../schema/garage";
import type { SeedContext, SeededCar } from "../context";
import { ITEM_PRICES_MKD } from "../fixtures/prices";
import type { CustomLine } from "../fixtures/types";
import { insertRows } from "../insert-rows";

type VisitRow = typeof garageServiceVisits.$inferInsert;

type VisitItemRow = typeof garageServiceVisitItems.$inferInsert;

const PRICES_MKD: ReadonlyMap<string, number> = new Map(
  Object.entries(ITEM_PRICES_MKD)
);

export interface VisitSpec {
  car: SeededCar;
  date: string;
  precision?: DatePrecision;
  odometerKm: number | null;
  kind: VisitKind;
  currency: Currency;
  /** Line names, priced from `prices.ts` (MKD visits only). */
  items?: readonly string[];
  custom?: readonly CustomLine[];
  labour?: number;
  shop?: string;
  notes?: string;
  byPreviousOwner?: boolean;
  blankTotal?: boolean;
}

export interface BuiltVisit {
  visit: VisitRow;
  items: VisitItemRow[];
}

interface ResolvedLine {
  label: string;
  cost: number | null;
  notes: string | null;
}

const pricedLine = (name: string, currency: Currency): ResolvedLine => ({
  cost: currency === "MKD" ? (PRICES_MKD.get(name) ?? null) : null,
  label: name,
  notes: null,
});

const customLine = (line: CustomLine): ResolvedLine => ({
  cost: line.cost ?? null,
  label: line.label,
  notes: line.notes ?? null,
});

const sumCosts = (costs: readonly (number | null)[]): number =>
  costs.reduce<number>((total, cost) => total + (cost ?? 0), 0);

/** Builds a visit with its lines; the invoice total is parts plus labour. */
export const buildVisit = (ctx: SeedContext, spec: VisitSpec): BuiltVisit => {
  const visitId = crypto.randomUUID();

  const lines = [
    ...(spec.items ?? []).map((name) => pricedLine(name, spec.currency)),
    ...(spec.custom ?? []).map((line) => customLine(line)),
  ];

  const total = sumCosts(lines.map((line) => line.cost)) + (spec.labour ?? 0);

  return {
    items: lines.map((line, position) => ({
      costMinor: line.cost === null ? null : toMinor(line.cost),
      id: crypto.randomUUID(),
      label: line.label,
      notes: line.notes,
      position,
      visitId,
    })),
    visit: {
      byPreviousOwner: spec.byPreviousOwner ?? false,
      carId: spec.car.id,
      currency: spec.currency,
      date: spec.date,
      datePrecision: spec.precision ?? "day",
      householdId: ctx.householdId,
      id: visitId,
      kind: spec.kind,
      notes: spec.notes ?? null,
      odometerKm: spec.odometerKm,
      shop: spec.shop ?? null,
      totalMinor: spec.blankTotal === true ? null : toMinor(total),
    },
  };
};

export const saveVisits = async (
  ctx: SeedContext,
  built: readonly BuiltVisit[]
): Promise<{ visits: number; lines: number }> => {
  const visits = await insertRows(
    ctx.db,
    garageServiceVisits,
    built.map((entry) => entry.visit)
  );

  // Lines reference their visit, so they go in after it.
  // oxlint-disable-next-line react-doctor/server-sequential-independent-await
  const lines = await insertRows(
    ctx.db,
    garageServiceVisitItems,
    built.flatMap((entry) => entry.items)
  );

  return { lines, visits };
};
