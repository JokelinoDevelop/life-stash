import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import type { GetFitnessSettingsResponse } from "./dto/get-fitness-settings.response";
import { updateFitnessSettingsRequest } from "./dto/update-fitness-settings.request";
import type { UpdateFitnessSettingsResponse } from "./dto/update-fitness-settings.response";

export const fitnessSettingsController = new Hono<AppEnv>()
  .get("/", async (c) => {
    const settings = await c.var.container.fitness.settings.get();
    const body: GetFitnessSettingsResponse = { reminders: settings.reminders };

    return c.json(body);
  })
  .put("/", validate("json", updateFitnessSettingsRequest), async (c) => {
    await c.var.container.fitness.settings.update(c.req.valid("json"));
    const body: UpdateFitnessSettingsResponse = { ok: true };

    return c.json(body);
  });
