import type { Db } from "../../core/db";
import {
  garageItems,
  garagePackageItems,
  garagePackages,
} from "../../db/schema/garage";

const OIL_SERVICE = ["Engine oil", "Oil filter", "Air filter", "Cabin filter"];

const BIG_SERVICE = [
  "Timing belt",
  "Tensioner and idler rollers",
  "Water pump",
  "Coolant",
];

const OTHER_ITEMS = [
  "Fuel filter",
  "Spark plugs",
  "Brake pads (front)",
  "Brake pads (rear)",
  "Brake discs",
  "Brake fluid",
  "Tyres",
  "Battery",
  "Wiper blades",
  "Gearbox oil",
];

/** Starter catalog so the first service entry is quick; everything stays editable. */
export const seedGarageCatalog = async (db: Db, householdId: string) => {
  const names = [...OIL_SERVICE, ...BIG_SERVICE, ...OTHER_ITEMS];

  const items = names.map((name) => ({
    id: crypto.randomUUID(),
    householdId,
    name,
  }));

  const idByName = new Map(items.map((item) => [item.name, item.id]));

  const packages = [
    {
      householdId,
      id: crypto.randomUUID(),
      items: OIL_SERVICE,
      name: "Oil service",
    },
    {
      householdId,
      id: crypto.randomUUID(),
      items: BIG_SERVICE,
      name: "Big service",
    },
  ];

  const links = packages.flatMap((pkg) =>
    pkg.items.map((name) => ({
      itemId: idByName.get(name) ?? "",
      packageId: pkg.id,
    }))
  );

  await db.batch([
    db.insert(garageItems).values(items),
    db
      .insert(garagePackages)
      .values(packages.map(({ id, name }) => ({ householdId, id, name }))),
    db.insert(garagePackageItems).values(links),
  ]);
};
