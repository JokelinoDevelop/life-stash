import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { financeOverviewQuery } from "./dto/finance-overview.request";
import { toFinanceOverviewResponse } from "./dto/finance-overview.response";
import type { FinanceOverviewResponse } from "./dto/finance-overview.response";

export const overviewController = new Hono<AppEnv>().get(
  "/",
  validate("query", financeOverviewQuery),
  async (c) => {
    const year = c.req.valid("query").year ?? new Date().getUTCFullYear();
    const overview = await c.var.container.finances.overview.get(year);
    const body: FinanceOverviewResponse = toFinanceOverviewResponse(overview);

    return c.json(body);
  }
);
