import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { createTransactionRequest } from "./dto/create-transaction.request";
import type { CreateTransactionResponse } from "./dto/create-transaction.response";
import { deleteTransactionParams } from "./dto/delete-transaction.request";
import type { DeleteTransactionResponse } from "./dto/delete-transaction.response";
import { getTransactionParams } from "./dto/get-transaction.request";
import { toGetTransactionResponse } from "./dto/get-transaction.response";
import type { GetTransactionResponse } from "./dto/get-transaction.response";
import { listTransactionsQuery } from "./dto/list-transactions.request";
import { toListTransactionsResponse } from "./dto/list-transactions.response";
import type { ListTransactionsResponse } from "./dto/list-transactions.response";
import { restoreTransactionParams } from "./dto/restore-transaction.request";
import type { RestoreTransactionResponse } from "./dto/restore-transaction.response";
import {
  updateTransactionParams,
  updateTransactionRequest,
} from "./dto/update-transaction.request";
import type { UpdateTransactionResponse } from "./dto/update-transaction.response";

const TRANSACTION_PATH = "/:transactionId";

export const transactionsController = new Hono<AppEnv>()
  .get("/", validate("query", listTransactionsQuery), async (c) => {
    const { cursor, ...filter } = c.req.valid("query");

    const page = await c.var.container.finances.transactions.list(
      filter,
      cursor
    );

    const body: ListTransactionsResponse = toListTransactionsResponse(page);

    return c.json(body);
  })
  .get(TRANSACTION_PATH, validate("param", getTransactionParams), async (c) => {
    const row = await c.var.container.finances.transactions.get(
      c.req.valid("param").transactionId
    );

    const body: GetTransactionResponse = toGetTransactionResponse(row);

    return c.json(body);
  })
  .post("/", validate("json", createTransactionRequest), async (c) => {
    const row = await c.var.container.finances.transactions.create(
      c.req.valid("json")
    );

    const body: CreateTransactionResponse = { id: row.id };

    return c.json(body, 201);
  })
  .patch(
    TRANSACTION_PATH,
    validate("param", updateTransactionParams),
    validate("json", updateTransactionRequest),
    async (c) => {
      const { transactionId } = c.req.valid("param");
      await c.var.container.finances.transactions.update(
        transactionId,
        c.req.valid("json")
      );
      const body: UpdateTransactionResponse = { id: transactionId };

      return c.json(body);
    }
  )
  .delete(
    TRANSACTION_PATH,
    validate("param", deleteTransactionParams),
    async (c) => {
      await c.var.container.finances.transactions.delete(
        c.req.valid("param").transactionId
      );
      const body: DeleteTransactionResponse = { ok: true };

      return c.json(body);
    }
  )
  .post(
    `${TRANSACTION_PATH}/restore`,
    validate("param", restoreTransactionParams),
    async (c) => {
      await c.var.container.finances.transactions.restore(
        c.req.valid("param").transactionId
      );
      const body: RestoreTransactionResponse = { ok: true };

      return c.json(body);
    }
  );
