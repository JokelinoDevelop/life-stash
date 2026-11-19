import { eq } from "drizzle-orm";

import { seedGarageCatalog } from "../../../modules/auth/catalog-seed";
import {
  garageItems,
  garagePackageItems,
  garagePackages,
} from "../../schema/garage";
import type { Seeder } from "../seeder";

/**
 * The same starter catalog a real sign-up gets, then loaded into `ctx.catalog` so later seeders
 * can refer to items and packages by name.
 */
export const catalogSeeder: Seeder = {
  name: "catalog",
  run: async (ctx) => {
    await seedGarageCatalog(ctx.db, ctx.householdId);

    const [items, packages, links] = await Promise.all([
      ctx.db
        .select()
        .from(garageItems)
        .where(eq(garageItems.householdId, ctx.householdId)),
      ctx.db
        .select()
        .from(garagePackages)
        .where(eq(garagePackages.householdId, ctx.householdId)),
      ctx.db
        .select({
          itemName: garageItems.name,
          packageId: garagePackageItems.packageId,
        })
        .from(garagePackageItems)
        .innerJoin(garageItems, eq(garageItems.id, garagePackageItems.itemId))
        .where(eq(garageItems.householdId, ctx.householdId)),
    ]);

    for (const item of items) {
      ctx.catalog.addItem(item.name, item.id);
    }

    const itemNamesByPackage = new Map<string, string[]>();

    for (const { packageId, itemName } of links) {
      const names = itemNamesByPackage.get(packageId) ?? [];
      names.push(itemName);
      itemNamesByPackage.set(packageId, names);
    }

    for (const pkg of packages) {
      ctx.catalog.addPackage(
        pkg.name,
        pkg.id,
        itemNamesByPackage.get(pkg.id) ?? []
      );
    }

    return { items: items.length, packages: packages.length };
  },
};
