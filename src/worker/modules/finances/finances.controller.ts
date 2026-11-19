import { Hono } from "hono";

import type { AppEnv } from "../../core/app-env";
import { categoriesController } from "./categories/categories.controller";
import { transactionsController } from "./transactions/transactions.controller";

/** Everything under `/api/finances`. */
export const financesController = new Hono<AppEnv>()
  .route("/categories", categoriesController)
  .route("/transactions", transactionsController);
