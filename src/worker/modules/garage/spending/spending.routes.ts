import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { findCar } from "../cars/cars.service";
import { carSpendingParams } from "./dto/car-spending.request";
import type { CarSpendingResponse } from "./dto/car-spending.response";
import type { HouseholdSpendingResponse } from "./dto/household-spending.response";
import { carSpending, householdSpending } from "./spending.service";

export const spendingRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    const cars = await householdSpending(c.var.db, c.var.auth.householdId);

    const body: HouseholdSpendingResponse = {
      cars: cars.map((car) => ({
        archived: car.archived,
        carId: car.carId,
        carName: car.carName,
        years: car.years.map((year) => ({
          currency: year.currency,
          maintenanceMinor: year.maintenanceMinor + year.repairMinor,
          otherMinor: year.otherMinor,
          year: year.year,
        })),
      })),
    };

    return c.json(body);
  })
  .get("/cars/:carId", validate("param", carSpendingParams), async (c) => {
    const { householdId } = c.var.auth;

    const car = await findCar(
      c.var.db,
      householdId,
      c.req.valid("param").carId
    );

    const body: CarSpendingResponse = {
      years: await carSpending(c.var.db, householdId, car.id),
    };

    return c.json(body);
  });
