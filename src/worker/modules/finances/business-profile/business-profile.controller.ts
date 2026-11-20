import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { toGetBusinessProfileResponse } from "./dto/get-business-profile.response";
import type { GetBusinessProfileResponse } from "./dto/get-business-profile.response";
import { updateBusinessProfileRequest } from "./dto/update-business-profile.request";
import { toUpdateBusinessProfileResponse } from "./dto/update-business-profile.response";
import type { UpdateBusinessProfileResponse } from "./dto/update-business-profile.response";

export const businessProfileController = new Hono<AppEnv>()
  .get("/", async (c) => {
    const profile = await c.var.container.finances.businessProfile.get();

    const body: GetBusinessProfileResponse =
      toGetBusinessProfileResponse(profile);

    return c.json(body);
  })
  .put("/", validate("json", updateBusinessProfileRequest), async (c) => {
    const profile = await c.var.container.finances.businessProfile.save(
      c.req.valid("json")
    );

    const body: UpdateBusinessProfileResponse =
      toUpdateBusinessProfileResponse(profile);

    return c.json(body);
  });
