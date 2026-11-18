import { Hono } from "hono";

import type { AppEnv } from "../../core/app-env";
import { carRoutes } from "./cars/cars.routes";
import { expenseRoutes } from "./expenses/expenses.routes";
import { itemRoutes } from "./items/items.routes";
import { packageRoutes } from "./items/packages.routes";
import { mileageRoutes } from "./mileage/mileage.routes";
import { reminderRoutes } from "./reminders/reminders.routes";
import { spendingRoutes } from "./spending/spending.routes";
import { visitRoutes } from "./visits/visits.routes";

export const garageRoutes = new Hono<AppEnv>()
  .route("/cars", carRoutes)
  .route("/items", itemRoutes)
  .route("/packages", packageRoutes)
  .route("/visits", visitRoutes)
  .route("/mileage", mileageRoutes)
  .route("/reminders", reminderRoutes)
  .route("/expenses", expenseRoutes)
  .route("/spending", spendingRoutes);
