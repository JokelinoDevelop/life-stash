import { and, asc, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { garageItems } from "../../../db/schema/garage";
import {
  archiveItemParams,
  archiveItemRequest,
} from "./dto/archive-item.request";
import type { ArchiveItemResponse } from "./dto/archive-item.response";
import { createItemRequest } from "./dto/create-item.request";
import type { CreateItemResponse } from "./dto/create-item.response";
import { listItemsQuery } from "./dto/list-items.request";
import type { ListItemsResponse } from "./dto/list-items.response";
import { renameItemParams, renameItemRequest } from "./dto/rename-item.request";
import type { RenameItemResponse } from "./dto/rename-item.response";
import { findItem, itemUsage } from "./items.service";

export const itemRoutes = new Hono<AppEnv>()
  .get("/", validate("query", listItemsQuery), async (c) => {
    const { householdId } = c.var.auth;
    const filters = [eq(garageItems.householdId, householdId)];

    if (!c.req.valid("query").includeArchived) {
      filters.push(isNull(garageItems.archivedAt));
    }

    const [rows, usage] = await Promise.all([
      c.var.db
        .select()
        .from(garageItems)
        .where(and(...filters))
        .orderBy(asc(garageItems.name)),
      itemUsage(c.var.db, householdId),
    ]);

    const body: ListItemsResponse = {
      items: rows.map((row) => ({
        archivedAt: row.archivedAt,
        id: row.id,
        lastDoneOn: usage.get(row.id)?.lastDoneOn ?? null,
        name: row.name,
        timesDone: usage.get(row.id)?.timesDone ?? 0,
      })),
    };

    return c.json(body);
  })
  .post("/", validate("json", createItemRequest), async (c) => {
    const [row] = await c.var.db
      .insert(garageItems)
      .values({
        householdId: c.var.auth.householdId,
        name: c.req.valid("json").name,
      })
      .returning({ id: garageItems.id });

    const body: CreateItemResponse = { id: row?.id ?? "" };

    return c.json(body, 201);
  })
  .put(
    "/:itemId",
    validate("param", renameItemParams),
    validate("json", renameItemRequest),
    async (c) => {
      const item = await findItem(
        c.var.db,
        c.var.auth.householdId,
        c.req.valid("param").itemId
      );

      await c.var.db
        .update(garageItems)
        .set({ name: c.req.valid("json").name })
        .where(eq(garageItems.id, item.id));
      const body: RenameItemResponse = { id: item.id };

      return c.json(body);
    }
  )
  .post(
    "/:itemId/archive",
    validate("param", archiveItemParams),
    validate("json", archiveItemRequest),
    async (c) => {
      const item = await findItem(
        c.var.db,
        c.var.auth.householdId,
        c.req.valid("param").itemId
      );

      await c.var.db
        .update(garageItems)
        .set({
          archivedAt: c.req.valid("json").archived
            ? new Date().toISOString()
            : null,
        })
        .where(eq(garageItems.id, item.id));
      const body: ArchiveItemResponse = { id: item.id };

      return c.json(body);
    }
  );
