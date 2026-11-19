import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { createClientRequest } from "./dto/create-client.request";
import type { CreateClientResponse } from "./dto/create-client.response";
import { deleteClientParams } from "./dto/delete-client.request";
import type { DeleteClientResponse } from "./dto/delete-client.response";
import { getClientParams, getClientQuery } from "./dto/get-client.request";
import { toGetClientResponse } from "./dto/get-client.response";
import type { GetClientResponse } from "./dto/get-client.response";
import { listClientsQuery } from "./dto/list-clients.request";
import { toListClientsResponse } from "./dto/list-clients.response";
import type { ListClientsResponse } from "./dto/list-clients.response";
import {
  updateClientParams,
  updateClientRequest,
} from "./dto/update-client.request";
import type { UpdateClientResponse } from "./dto/update-client.response";

const CLIENT_PATH = "/:clientId";

const thisYear = () => new Date().getUTCFullYear();

export const clientsController = new Hono<AppEnv>()
  .get("/", validate("query", listClientsQuery), async (c) => {
    const year = c.req.valid("query").year ?? thisYear();
    const rows = await c.var.container.finances.clients.list(year);
    const body: ListClientsResponse = toListClientsResponse(year, rows);

    return c.json(body);
  })
  .get(
    CLIENT_PATH,
    validate("param", getClientParams),
    validate("query", getClientQuery),
    async (c) => {
      const year = c.req.valid("query").year ?? thisYear();

      const detail = await c.var.container.finances.clients.detail(
        c.req.valid("param").clientId,
        year
      );

      const body: GetClientResponse = toGetClientResponse(year, detail);

      return c.json(body);
    }
  )
  .post("/", validate("json", createClientRequest), async (c) => {
    const row = await c.var.container.finances.clients.create(
      c.req.valid("json")
    );

    const body: CreateClientResponse = { id: row.id };

    return c.json(body, 201);
  })
  .patch(
    CLIENT_PATH,
    validate("param", updateClientParams),
    validate("json", updateClientRequest),
    async (c) => {
      const { clientId } = c.req.valid("param");
      await c.var.container.finances.clients.update(
        clientId,
        c.req.valid("json")
      );
      const body: UpdateClientResponse = { id: clientId };

      return c.json(body);
    }
  )
  .delete(CLIENT_PATH, validate("param", deleteClientParams), async (c) => {
    await c.var.container.finances.clients.delete(
      c.req.valid("param").clientId
    );
    const body: DeleteClientResponse = { ok: true };

    return c.json(body);
  });
