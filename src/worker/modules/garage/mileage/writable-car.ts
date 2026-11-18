import type { Db } from "../../../core/db";
import { conflict } from "../../../core/errors";
import { findCar } from "../cars/cars.service";
import type { CarRow } from "../cars/cars.service";

/** Loads a car of the household and rejects writes when it is archived (read-only). */
export const findWritableCar = async (
  db: Db,
  householdId: string,
  carId: string
): Promise<CarRow> => {
  const car = await findCar(db, householdId, carId);

  if (car.archivedAt !== null) {
    throw conflict("This car is archived");
  }

  return car;
};
