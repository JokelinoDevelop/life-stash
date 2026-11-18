import { asc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { garagePackageItems, garagePackages } from "../../../db/schema/garage";
import { createPackageRequest } from "./dto/create-package.request";
import type { CreatePackageResponse } from "./dto/create-package.response";
import { deletePackageParams } from "./dto/delete-package.request";
import type { DeletePackageResponse } from "./dto/delete-package.response";
import type { ListPackagesResponse } from "./dto/list-packages.response";
import {
  updatePackageParams,
  updatePackageRequest,
} from "./dto/update-package.request";
import type { UpdatePackageResponse } from "./dto/update-package.response";
import { assertItemsOwned, findPackage } from "./items.service";

export const packageRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    const packages = await c.var.db
      .select()
      .from(garagePackages)
      .where(eq(garagePackages.householdId, c.var.auth.householdId))
      .orderBy(asc(garagePackages.name));

    const links =
      packages.length === 0
        ? []
        : await c.var.db
            .select()
            .from(garagePackageItems)
            .where(
              inArray(
                garagePackageItems.packageId,
                packages.map((pkg) => pkg.id)
              )
            );

    const body: ListPackagesResponse = {
      packages: packages.map((pkg) => ({
        id: pkg.id,
        itemIds: links.flatMap((link) =>
          link.packageId === pkg.id ? [link.itemId] : []
        ),
        name: pkg.name,
        notes: pkg.notes,
      })),
    };

    return c.json(body);
  })
  .post("/", validate("json", createPackageRequest), async (c) => {
    const input = c.req.valid("json");
    const { householdId } = c.var.auth;
    await assertItemsOwned(c.var.db, householdId, input.itemIds);
    const id = crypto.randomUUID();
    const itemIds = [...new Set(input.itemIds)];

    const insertPackage = c.var.db
      .insert(garagePackages)
      .values({ name: input.name, notes: input.notes, id, householdId });

    await (itemIds.length === 0
      ? insertPackage
      : c.var.db.batch([
          insertPackage,
          c.var.db
            .insert(garagePackageItems)
            .values(itemIds.map((itemId) => ({ packageId: id, itemId }))),
        ]));

    const body: CreatePackageResponse = { id };

    return c.json(body, 201);
  })
  .put(
    "/:packageId",
    validate("param", updatePackageParams),
    validate("json", updatePackageRequest),
    async (c) => {
      const input = c.req.valid("json");
      const { householdId } = c.var.auth;

      const pkg = await findPackage(
        c.var.db,
        householdId,
        c.req.valid("param").packageId
      );

      await assertItemsOwned(c.var.db, householdId, input.itemIds);
      const itemIds = [...new Set(input.itemIds)];

      const update = c.var.db
        .update(garagePackages)
        .set({ name: input.name, notes: input.notes })
        .where(eq(garagePackages.id, pkg.id));

      const clear = c.var.db
        .delete(garagePackageItems)
        .where(eq(garagePackageItems.packageId, pkg.id));

      await (itemIds.length === 0
        ? c.var.db.batch([update, clear])
        : c.var.db.batch([
            update,
            clear,
            c.var.db
              .insert(garagePackageItems)
              .values(itemIds.map((itemId) => ({ packageId: pkg.id, itemId }))),
          ]));

      const body: UpdatePackageResponse = { id: pkg.id };

      return c.json(body);
    }
  )
  .delete("/:packageId", validate("param", deletePackageParams), async (c) => {
    const pkg = await findPackage(
      c.var.db,
      c.var.auth.householdId,
      c.req.valid("param").packageId
    );

    await c.var.db.delete(garagePackages).where(eq(garagePackages.id, pkg.id));
    const body: DeletePackageResponse = { ok: true };

    return c.json(body);
  });
