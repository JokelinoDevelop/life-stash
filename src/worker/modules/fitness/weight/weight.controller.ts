import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { deleteWeightParams } from "./dto/delete-weight.request";
import type { DeleteWeightResponse } from "./dto/delete-weight.response";
import { listWeightQuery } from "./dto/list-weight.request";
import { toListWeightResponse } from "./dto/list-weight.response";
import type { ListWeightResponse } from "./dto/list-weight.response";
import { upsertWeightRequest } from "./dto/upsert-weight.request";
import type { UpsertWeightResponse } from "./dto/upsert-weight.response";

export const weightController = new Hono<AppEnv>()
  .get("/", validate("query", listWeightQuery), async (c) => {
    const rows = await c.var.container.fitness.weight.list(
      c.req.valid("query")
    );

    const body: ListWeightResponse = toListWeightResponse(rows);

    return c.json(body);
  })
  .put("/", validate("json", upsertWeightRequest), async (c) => {
    const row = await c.var.container.fitness.weight.upsert(
      c.req.valid("json")
    );

    const body: UpsertWeightResponse = { id: row.id };

    return c.json(body);
  })
  .delete("/:entryId", validate("param", deleteWeightParams), async (c) => {
    await c.var.container.fitness.weight.delete(c.req.valid("param").entryId);
    const body: DeleteWeightResponse = { ok: true };

    return c.json(body);
  });
