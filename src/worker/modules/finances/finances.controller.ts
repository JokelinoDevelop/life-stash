import { Hono } from "hono";

import type { AppEnv } from "../../core/app-env";
import { businessProfileController } from "./business-profile/business-profile.controller";
import { categoriesController } from "./categories/categories.controller";
import { clientsController } from "./clients/clients.controller";
import { exportController } from "./export/export.controller";
import { invoicesController } from "./invoices/invoices.controller";
import { overviewController } from "./overview/overview.controller";
import { projectsController } from "./projects/projects.controller";
import { recurringController } from "./recurring/recurring.controller";
import { financeSettingsController } from "./settings/settings.controller";
import { transactionsController } from "./transactions/transactions.controller";

/** Everything under `/api/finances`. */
export const financesController = new Hono<AppEnv>()
  .route("/overview", overviewController)
  .route("/categories", categoriesController)
  .route("/transactions", transactionsController)
  .route("/clients", clientsController)
  .route("/invoices", invoicesController)
  .route("/settings", financeSettingsController)
  .route("/business-profile", businessProfileController)
  .route("/projects", projectsController)
  .route("/recurring", recurringController)
  .route("/export.csv", exportController);
