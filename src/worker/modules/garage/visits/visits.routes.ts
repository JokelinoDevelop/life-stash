import { lastDonePerItem } from "@shared/domain/item-history";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import {
  garageItems,
  garageServiceVisitItems,
  garageServiceVisits,
} from "../../../db/schema/garage";
import { deletePhotosOfOwners } from "../../photos/photos.service";
import { findCar } from "../cars/cars.service";
import { completeReminder } from "../reminders/completion";
import { sendReminderHeadsUps } from "../reminders/heads-up";
import { createVisitRequest } from "./dto/create-visit.request";
import type { CreateVisitResponse } from "./dto/create-visit.response";
import { deleteVisitParams } from "./dto/delete-visit.request";
import type { DeleteVisitResponse } from "./dto/delete-visit.response";
import { getVisitParams } from "./dto/get-visit.request";
import type { GetVisitResponse } from "./dto/get-visit.response";
import { itemHistoryQuery } from "./dto/item-history.request";
import type { ItemHistoryResponse } from "./dto/item-history.response";
import { listVisitsQuery } from "./dto/list-visits.request";
import type { ListVisitsResponse } from "./dto/list-visits.response";
import {
  updateVisitParams,
  updateVisitRequest,
} from "./dto/update-visit.request";
import type { UpdateVisitResponse } from "./dto/update-visit.response";
import {
  assertWritableCar,
  findVisit,
  photoCounts,
  prepareVisitItems,
  visitsOfCar,
  visitWithItems,
} from "./visits.service";

export const visitRoutes = new Hono<AppEnv>()
  .get("/", validate("query", listVisitsQuery), async (c) => {
    const { householdId } = c.var.auth;

    const car = await findCar(
      c.var.db,
      householdId,
      c.req.valid("query").carId
    );

    const visits = await visitsOfCar(c.var.db, householdId, car.id);

    const counts = await photoCounts(
      c.var.db,
      householdId,
      visits.map(({ visit }) => visit.id)
    );

    const body: ListVisitsResponse = {
      visits: visits.map(({ visit, items, effectiveTotalMinor }) => ({
        byPreviousOwner: visit.byPreviousOwner,
        currency: visit.currency,
        date: visit.date,
        datePrecision: visit.datePrecision,
        id: visit.id,
        items: items.map((item) => ({
          costMinor: item.costMinor,
          id: item.id,
          itemId: item.itemId,
          label: item.label,
        })),
        kind: visit.kind,
        notes: visit.notes,
        odometerKm: visit.odometerKm,
        photoCount: counts.get(visit.id) ?? 0,
        shop: visit.shop,
        totalMinor: visit.totalMinor,
        effectiveTotalMinor,
      })),
    };

    return c.json(body);
  })
  .get("/item-history", validate("query", itemHistoryQuery), async (c) => {
    const { householdId } = c.var.auth;

    const car = await findCar(
      c.var.db,
      householdId,
      c.req.valid("query").carId
    );

    const [visits, catalog] = await Promise.all([
      visitsOfCar(c.var.db, householdId, car.id),
      c.var.db
        .select({ id: garageItems.id, name: garageItems.name })
        .from(garageItems)
        .where(eq(garageItems.householdId, householdId)),
    ]);

    const names = new Map(catalog.map((item) => [item.id, item.name]));

    const done = visits.flatMap(({ visit, items }) =>
      items.flatMap((item) =>
        item.itemId === null
          ? []
          : [
              {
                byPreviousOwner: visit.byPreviousOwner,
                date: visit.date,
                datePrecision: visit.datePrecision,
                itemId: item.itemId,
                label: names.get(item.itemId) ?? item.label,
                odometerKm: visit.odometerKm,
                visitId: visit.id,
              },
            ]
      )
    );

    const body: ItemHistoryResponse = {
      items: lastDonePerItem(done).map((entry) => ({
        byPreviousOwner: entry.byPreviousOwner,
        itemId: entry.itemId,
        lastDate: entry.date,
        lastDatePrecision: entry.datePrecision,
        lastOdometerKm: entry.odometerKm,
        name: entry.label,
        timesDone: entry.timesDone,
        visitId: entry.visitId,
      })),
    };

    return c.json(body);
  })
  .get("/:visitId", validate("param", getVisitParams), async (c) => {
    const visit = await findVisit(
      c.var.db,
      c.var.auth.householdId,
      c.req.valid("param").visitId
    );

    const { items, effectiveTotalMinor } = await visitWithItems(
      c.var.db,
      visit
    );

    const body: GetVisitResponse = {
      visit: {
        byPreviousOwner: visit.byPreviousOwner,
        carId: visit.carId,
        createdAt: visit.createdAt,
        currency: visit.currency,
        date: visit.date,
        datePrecision: visit.datePrecision,
        id: visit.id,
        items: items.map((item) => ({
          costMinor: item.costMinor,
          id: item.id,
          itemId: item.itemId,
          label: item.label,
        })),
        kind: visit.kind,
        notes: visit.notes,
        odometerKm: visit.odometerKm,
        shop: visit.shop,
        totalMinor: visit.totalMinor,
        effectiveTotalMinor,
      },
    };

    return c.json(body);
  })
  .post("/", validate("json", createVisitRequest), async (c) => {
    const {
      reminderId,
      items: inputItems,
      carId,
      ...fields
    } = c.req.valid("json");

    const { householdId } = c.var.auth;
    const car = await findCar(c.var.db, householdId, carId);
    assertWritableCar(car);
    const items = await prepareVisitItems(c.var.db, householdId, inputItems);
    const id = crypto.randomUUID();
    await c.var.db.batch([
      c.var.db
        .insert(garageServiceVisits)
        .values({ ...fields, carId: car.id, id, householdId }),
      c.var.db
        .insert(garageServiceVisitItems)
        .values(items.map((item) => ({ ...item, visitId: id }))),
    ]);

    const nextReminderId =
      reminderId === null
        ? null
        : await completeReminder(c.var.db, {
            completedAtKm: fields.odometerKm,
            completedOn: fields.date,
            visitId: id,
            householdId,
            reminderId,
          });

    if (fields.odometerKm !== null) {
      c.executionCtx.waitUntil(
        sendReminderHeadsUps(c.env, c.var.db, householdId, car.id)
      );
    }

    const body: CreateVisitResponse = { id, nextReminderId };

    return c.json(body, 201);
  })
  .put(
    "/:visitId",
    validate("param", updateVisitParams),
    validate("json", updateVisitRequest),
    async (c) => {
      const { items: inputItems, ...fields } = c.req.valid("json");
      const { householdId } = c.var.auth;

      const visit = await findVisit(
        c.var.db,
        householdId,
        c.req.valid("param").visitId
      );

      const car = await findCar(c.var.db, householdId, visit.carId);
      assertWritableCar(car);
      const items = await prepareVisitItems(c.var.db, householdId, inputItems);
      await c.var.db.batch([
        c.var.db
          .update(garageServiceVisits)
          .set(fields)
          .where(eq(garageServiceVisits.id, visit.id)),
        c.var.db
          .delete(garageServiceVisitItems)
          .where(eq(garageServiceVisitItems.visitId, visit.id)),
        c.var.db
          .insert(garageServiceVisitItems)
          .values(items.map((item) => ({ ...item, visitId: visit.id }))),
      ]);

      if (fields.odometerKm !== null) {
        c.executionCtx.waitUntil(
          sendReminderHeadsUps(c.env, c.var.db, householdId, car.id)
        );
      }

      const body: UpdateVisitResponse = { id: visit.id };

      return c.json(body);
    }
  )
  .delete("/:visitId", validate("param", deleteVisitParams), async (c) => {
    const { householdId } = c.var.auth;

    const visit = await findVisit(
      c.var.db,
      householdId,
      c.req.valid("param").visitId
    );

    assertWritableCar(await findCar(c.var.db, householdId, visit.carId));
    await deletePhotosOfOwners(c.env, c.var.db, householdId, {
      ownerIds: [visit.id],
      ownerType: "service_visit",
    });
    await c.var.db
      .delete(garageServiceVisits)
      .where(eq(garageServiceVisits.id, visit.id));
    const body: DeleteVisitResponse = { ok: true };

    return c.json(body);
  });
