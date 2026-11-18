import { and, eq } from "drizzle-orm";
import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { garageCars } from "../../../db/schema/garage";
import { deletePhotosOfCar } from "../../photos/photos.service";
import { findCar, listCars } from "./cars.service";
import { archiveCarParams, archiveCarRequest } from "./dto/archive-car.request";
import type { ArchiveCarResponse } from "./dto/archive-car.response";
import { carOverviewParams } from "./dto/car-overview.request";
import type { CarOverviewResponse } from "./dto/car-overview.response";
import { createCarRequest } from "./dto/create-car.request";
import type { CreateCarResponse } from "./dto/create-car.response";
import { deleteCarParams } from "./dto/delete-car.request";
import type { DeleteCarResponse } from "./dto/delete-car.response";
import { getCarParams } from "./dto/get-car.request";
import { toGetCarResponse } from "./dto/get-car.response";
import type { GetCarResponse } from "./dto/get-car.response";
import { listCarsQuery } from "./dto/list-cars.request";
import type { ListCarsResponse } from "./dto/list-cars.response";
import { unarchiveCarParams } from "./dto/unarchive-car.request";
import type { UnarchiveCarResponse } from "./dto/unarchive-car.response";
import { updateCarParams, updateCarRequest } from "./dto/update-car.request";
import type { UpdateCarResponse } from "./dto/update-car.response";
import { carOverview } from "./overview.service";

export const carRoutes = new Hono<AppEnv>()
  .get("/", validate("query", listCarsQuery), async (c) => {
    const { includeArchived } = c.req.valid("query");

    const body: ListCarsResponse = {
      cars: await listCars(c.var.db, c.var.auth.householdId, includeArchived),
    };

    return c.json(body);
  })
  .post("/", validate("json", createCarRequest), async (c) => {
    const [row] = await c.var.db
      .insert(garageCars)
      .values({ ...c.req.valid("json"), householdId: c.var.auth.householdId })
      .returning({ id: garageCars.id });

    const body: CreateCarResponse = { id: row?.id ?? "" };

    return c.json(body, 201);
  })
  .get("/:carId", validate("param", getCarParams), async (c) => {
    const car = await findCar(
      c.var.db,
      c.var.auth.householdId,
      c.req.valid("param").carId
    );

    const body: GetCarResponse = toGetCarResponse(car);

    return c.json(body);
  })
  .get("/:carId/overview", validate("param", carOverviewParams), async (c) => {
    const { householdId } = c.var.auth;

    const car = await findCar(
      c.var.db,
      householdId,
      c.req.valid("param").carId
    );

    const body: CarOverviewResponse = await carOverview(
      c.var.db,
      householdId,
      car.id
    );

    return c.json(body);
  })
  .put(
    "/:carId",
    validate("param", updateCarParams),
    validate("json", updateCarRequest),
    async (c) => {
      const { householdId } = c.var.auth;

      const car = await findCar(
        c.var.db,
        householdId,
        c.req.valid("param").carId
      );

      await c.var.db
        .update(garageCars)
        .set(c.req.valid("json"))
        .where(
          and(
            eq(garageCars.id, car.id),
            eq(garageCars.householdId, householdId)
          )
        );
      const body: UpdateCarResponse = { id: car.id };

      return c.json(body);
    }
  )
  .post(
    "/:carId/archive",
    validate("param", archiveCarParams),
    validate("json", archiveCarRequest),
    async (c) => {
      const car = await findCar(
        c.var.db,
        c.var.auth.householdId,
        c.req.valid("param").carId
      );

      await c.var.db
        .update(garageCars)
        .set({
          archivedAt: new Date().toISOString(),
          soldDate: c.req.valid("json").soldDate,
        })
        .where(eq(garageCars.id, car.id));
      const body: ArchiveCarResponse = { id: car.id };

      return c.json(body);
    }
  )
  .post(
    "/:carId/unarchive",
    validate("param", unarchiveCarParams),
    async (c) => {
      const car = await findCar(
        c.var.db,
        c.var.auth.householdId,
        c.req.valid("param").carId
      );

      await c.var.db
        .update(garageCars)
        .set({ archivedAt: null, soldDate: null })
        .where(eq(garageCars.id, car.id));
      const body: UnarchiveCarResponse = { id: car.id };

      return c.json(body);
    }
  )
  .delete("/:carId", validate("param", deleteCarParams), async (c) => {
    const { householdId } = c.var.auth;

    const car = await findCar(
      c.var.db,
      householdId,
      c.req.valid("param").carId
    );

    await deletePhotosOfCar(c.env, c.var.db, householdId, car.id);
    await c.var.db.delete(garageCars).where(eq(garageCars.id, car.id));
    const body: DeleteCarResponse = { ok: true };

    return c.json(body);
  });
