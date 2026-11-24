import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { toGetFitnessOverviewResponse } from "./dto/get-overview.response";
import type { GetFitnessOverviewResponse } from "./dto/get-overview.response";

export const fitnessOverviewController = new Hono<AppEnv>().get(
  "/",
  async (c) => {
    const overview = await c.var.container.fitness.overview.get();

    const body: GetFitnessOverviewResponse =
      toGetFitnessOverviewResponse(overview);

    return c.json(body);
  }
);
