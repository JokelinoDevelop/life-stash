import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { confirmRecurringParams } from "./dto/confirm-recurring.request";
import type { ConfirmRecurringResponse } from "./dto/confirm-recurring.response";
import { createRecurringRequest } from "./dto/create-recurring.request";
import type { CreateRecurringResponse } from "./dto/create-recurring.response";
import { deleteRecurringParams } from "./dto/delete-recurring.request";
import type { DeleteRecurringResponse } from "./dto/delete-recurring.response";
import { toListRecurringResponse } from "./dto/list-recurring.response";
import type { ListRecurringResponse } from "./dto/list-recurring.response";
import { skipRecurringParams } from "./dto/skip-recurring.request";
import type { SkipRecurringResponse } from "./dto/skip-recurring.response";
import {
  updateRecurringParams,
  updateRecurringRequest,
} from "./dto/update-recurring.request";
import type { UpdateRecurringResponse } from "./dto/update-recurring.response";

const RECURRING_PATH = "/:recurringId";

export const recurringController = new Hono<AppEnv>()
  .get("/", async (c) => {
    const rows = await c.var.container.finances.recurring.list();
    const body: ListRecurringResponse = toListRecurringResponse(rows);

    return c.json(body);
  })
  .post("/", validate("json", createRecurringRequest), async (c) => {
    const row = await c.var.container.finances.recurring.create(
      c.req.valid("json")
    );

    const body: CreateRecurringResponse = { id: row.id };

    return c.json(body, 201);
  })
  .patch(
    RECURRING_PATH,
    validate("param", updateRecurringParams),
    validate("json", updateRecurringRequest),
    async (c) => {
      const { recurringId } = c.req.valid("param");
      await c.var.container.finances.recurring.update(
        recurringId,
        c.req.valid("json")
      );
      const body: UpdateRecurringResponse = { id: recurringId };

      return c.json(body);
    }
  )
  .delete(
    RECURRING_PATH,
    validate("param", deleteRecurringParams),
    async (c) => {
      await c.var.container.finances.recurring.delete(
        c.req.valid("param").recurringId
      );
      const body: DeleteRecurringResponse = { ok: true };

      return c.json(body);
    }
  )
  .post(
    `${RECURRING_PATH}/confirm`,
    validate("param", confirmRecurringParams),
    async (c) => {
      const transaction = await c.var.container.finances.recurring.confirm(
        c.req.valid("param").recurringId
      );

      const body: ConfirmRecurringResponse = { transactionId: transaction.id };

      return c.json(body);
    }
  )
  .post(
    `${RECURRING_PATH}/skip`,
    validate("param", skipRecurringParams),
    async (c) => {
      await c.var.container.finances.recurring.skip(
        c.req.valid("param").recurringId
      );
      const body: SkipRecurringResponse = { ok: true };

      return c.json(body);
    }
  );
