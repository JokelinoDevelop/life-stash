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

/** Name → id lookups for the household's item catalog. Unknown names throw, catching typos. */
export class CatalogRefs {
  readonly #items = new Map<string, string>();
  readonly #packages = new Map<string, { id: string; items: string[] }>();

  addItem(name: string, id: string): void {
    this.#items.set(name, id);
  }

  addPackage(name: string, id: string, items: string[]): void {
    this.#packages.set(name, { id, items });
  }

  hasItem(name: string): boolean {
    return this.#items.has(name);
  }

  itemId(name: string): string {
    const id = this.#items.get(name);

    if (id === undefined) {
      throw new Error(
        `Unknown catalog item "${name}". Is the catalog seeded before this seeder?`
      );
    }

    return id;
  }

  package(name: string): { id: string; items: string[] } {
    const found = this.#packages.get(name);

    if (found === undefined) {
      throw new Error(
        `Unknown package "${name}". Is the catalog seeded before this seeder?`
      );
    }

    return found;
  }
}

/** Shared state handed to every seeder, in order. Earlier seeders fill `catalog` and `cars`. */
export interface SeedContext {
  db: Db;
  householdId: string;
  /** Today in the household's time zone; all fixture offsets are relative to it. */
  today: string;
  random: Random;
  catalog: CatalogRefs;
  cars: SeededCar[];
  /** Filled by the finance seeders: category and client ids by (English) name. */
  finance: { categoryIds: Map<string, string>; clientIds: Map<string, string> };
}
