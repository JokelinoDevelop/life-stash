import { Hono } from "hono";

import type { AppEnv } from "../../core/app-env";
import { fitnessOverviewController } from "./overview/overview.controller";
import { sessionsController } from "./sessions/sessions.controller";
import { fitnessSettingsController } from "./settings/settings.controller";
import { trainingsController } from "./trainings/trainings.controller";
import { weightController } from "./weight/weight.controller";

/** Everything under `/api/fitness` (all of it per user). */
export const fitnessController = new Hono<AppEnv>()
  .route("/overview", fitnessOverviewController)
  .route("/trainings", trainingsController)
  .route("/sessions", sessionsController)
  .route("/weight", weightController)
  .route("/settings", fitnessSettingsController);
