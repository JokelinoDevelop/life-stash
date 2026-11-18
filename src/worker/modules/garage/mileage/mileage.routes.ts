import { eq } from "drizzle-orm";
import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { garageOdometerReadings } from "../../../db/schema/garage";
import { findCar } from "../cars/cars.service";
import { odometerPointsForCar } from "../odometer";
import { sendReminderHeadsUps } from "../reminders/heads-up";
import { createReadingRequest } from "./dto/create-reading.request";
import type { CreateReadingResponse } from "./dto/create-reading.response";
import { deleteReadingParams } from "./dto/delete-reading.request";
import type { DeleteReadingResponse } from "./dto/delete-reading.response";
import { listMileageQuery } from "./dto/list-mileage.request";
import type { ListMileageResponse } from "./dto/list-mileage.response";
import {
  updateReadingParams,
  updateReadingRequest,
} from "./dto/update-reading.request";
import type { UpdateReadingResponse } from "./dto/update-reading.response";
import { findReading } from "./mileage.service";
import { findWritableCar } from "./writable-car";

export const mileageRoutes = new Hono<AppEnv>()
  .get("/", validate("query", listMileageQuery), async (c) => {
    const { householdId } = c.var.auth;

    const car = await findCar(
      c.var.db,
      householdId,
      c.req.valid("query").carId
    );

    const points = await odometerPointsForCar(c.var.db, householdId, car.id);

    const body: ListMileageResponse = {
      points: points.map((point) => ({
        date: point.date,
        id: point.id,
        notes: point.notes,
        odometerKm: point.odometerKm,
        source: point.source,
      })),
    };

    return c.json(body);
  })
  .post("/", validate("json", createReadingRequest), async (c) => {
    const input = c.req.valid("json");
    const { householdId } = c.var.auth;
    const car = await findWritableCar(c.var.db, householdId, input.carId);

    const [row] = await c.var.db
      .insert(garageOdometerReadings)
      .values({ ...input, carId: car.id, householdId })
      .returning({ id: garageOdometerReadings.id });

    c.executionCtx.waitUntil(
      sendReminderHeadsUps(c.env, c.var.db, householdId, car.id)
    );
    const body: CreateReadingResponse = { id: row?.id ?? "" };

    return c.json(body, 201);
  })
  .put(
    "/:readingId",
    validate("param", updateReadingParams),
    validate("json", updateReadingRequest),
    async (c) => {
      const { householdId } = c.var.auth;

      const reading = await findReading(
        c.var.db,
        householdId,
        c.req.valid("param").readingId
      );

      await findWritableCar(c.var.db, householdId, reading.carId);
      await c.var.db
        .update(garageOdometerReadings)
        .set(c.req.valid("json"))
        .where(eq(garageOdometerReadings.id, reading.id));
      c.executionCtx.waitUntil(
        sendReminderHeadsUps(c.env, c.var.db, householdId, reading.carId)
      );
      const body: UpdateReadingResponse = { id: reading.id };

      return c.json(body);
    }
  )
  .delete("/:readingId", validate("param", deleteReadingParams), async (c) => {
    const { householdId } = c.var.auth;

    const reading = await findReading(
      c.var.db,
      householdId,
      c.req.valid("param").readingId
    );

    await findWritableCar(c.var.db, householdId, reading.carId);
    await c.var.db
      .delete(garageOdometerReadings)
      .where(eq(garageOdometerReadings.id, reading.id));
    const body: DeleteReadingResponse = { ok: true };

    return c.json(body);
  });
