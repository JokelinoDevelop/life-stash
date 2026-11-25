import type { Db } from "../../core/db";
import type { CarFixture } from "./fixtures/types";
import type { Mileage } from "./mileage";
import type { Random } from "./random";

/** A car the cars seeder inserted, with everything later seeders need to date its records. */
export interface SeededCar {
  id: string;
  fixture: CarFixture;
  /** The day it joined the household. */
  ownedFrom: string;
  /** The sale date, or today. */
  ownedUntil: string;
  isActive: boolean;
  odometerOn: Mileage;
}

/** Shared state handed to every seeder, in order. Earlier seeders fill `cars`. */
export interface SeedContext {
  db: Db;
  householdId: string;
  /** Today in the household's time zone; all fixture offsets are relative to it. */
  today: string;
  random: Random;
  cars: SeededCar[];
  /** Filled by the finance seeders: category and client ids by (English) name. */
  finance: { categoryIds: Map<string, string>; clientIds: Map<string, string> };
}
