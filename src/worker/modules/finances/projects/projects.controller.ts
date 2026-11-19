import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { createProjectRequest } from "./dto/create-project.request";
import type { CreateProjectResponse } from "./dto/create-project.response";
import { deleteProjectParams } from "./dto/delete-project.request";
import type { DeleteProjectResponse } from "./dto/delete-project.response";
import { listProjectsQuery } from "./dto/list-projects.request";
import { toListProjectsResponse } from "./dto/list-projects.response";
import type { ListProjectsResponse } from "./dto/list-projects.response";
import {
  updateProjectParams,
  updateProjectRequest,
} from "./dto/update-project.request";
import type { UpdateProjectResponse } from "./dto/update-project.response";

const PROJECT_PATH = "/:projectId";

export const projectsController = new Hono<AppEnv>()
  .get("/", validate("query", listProjectsQuery), async (c) => {
    const rows = await c.var.container.finances.projects.list(
      c.req.valid("query").clientId
    );

    const body: ListProjectsResponse = toListProjectsResponse(rows);

    return c.json(body);
  })
  .post("/", validate("json", createProjectRequest), async (c) => {
    const row = await c.var.container.finances.projects.create(
      c.req.valid("json")
    );

    const body: CreateProjectResponse = { id: row.id };

    return c.json(body, 201);
  })
  .patch(
    PROJECT_PATH,
    validate("param", updateProjectParams),
    validate("json", updateProjectRequest),
    async (c) => {
      const { projectId } = c.req.valid("param");
      await c.var.container.finances.projects.update(
        projectId,
        c.req.valid("json")
      );
      const body: UpdateProjectResponse = { id: projectId };

      return c.json(body);
    }
  )
  .delete(PROJECT_PATH, validate("param", deleteProjectParams), async (c) => {
    await c.var.container.finances.projects.delete(
      c.req.valid("param").projectId
    );
    const body: DeleteProjectResponse = { ok: true };

    return c.json(body);
  });
