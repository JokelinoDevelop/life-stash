import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import type { HouseholdOverviewResponse } from "./dto/household-overview.response";
import { householdOverview } from "./household.service";

export const householdRoutes = new Hono<AppEnv>().get("/", async (c) => {
  const body: HouseholdOverviewResponse = await householdOverview(
    c.var.db,
    c.var.auth.householdId
  );

  return c.json(body);
});
