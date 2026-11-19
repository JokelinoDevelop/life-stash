import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { toGetFinanceSettingsResponse } from "./dto/get-finance-settings.response";
import type { GetFinanceSettingsResponse } from "./dto/get-finance-settings.response";
import { updateFinanceSettingsRequest } from "./dto/update-finance-settings.request";
import type { UpdateFinanceSettingsResponse } from "./dto/update-finance-settings.response";

export const financeSettingsController = new Hono<AppEnv>()
  .get("/", async (c) => {
    const settings = await c.var.container.finances.settings.get();

    const body: GetFinanceSettingsResponse =
      toGetFinanceSettingsResponse(settings);

    return c.json(body);
  })
  .patch("/", validate("json", updateFinanceSettingsRequest), async (c) => {
    const settings = await c.var.container.finances.settings.update(
      c.req.valid("json")
    );

    const body: UpdateFinanceSettingsResponse = {
      defaultPaymentTermsDays: settings.defaultPaymentTermsDays,
      invoiceNumberFormat: settings.invoiceNumberFormat,
      overdueReminders: settings.overdueReminders,
    };

    return c.json(body);
  });
