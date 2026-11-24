import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { archiveTrainingParams } from "./dto/archive-training.request";
import type { ArchiveTrainingResponse } from "./dto/archive-training.response";
import { createTrainingRequest } from "./dto/create-training.request";
import type { CreateTrainingResponse } from "./dto/create-training.response";
import { listTrainingsQuery } from "./dto/list-trainings.request";
import { toListTrainingsResponse } from "./dto/list-trainings.response";
import type { ListTrainingsResponse } from "./dto/list-trainings.response";
import { restoreTrainingParams } from "./dto/restore-training.request";
import type { RestoreTrainingResponse } from "./dto/restore-training.response";
import {
  updateTrainingParams,
  updateTrainingRequest,
} from "./dto/update-training.request";
import type { UpdateTrainingResponse } from "./dto/update-training.response";

const TRAINING_PATH = "/:trainingId";

export const trainingsController = new Hono<AppEnv>()
  .get("/", validate("query", listTrainingsQuery), async (c) => {
    const rows = await c.var.container.fitness.trainings.list(
      c.req.valid("query").archived === "true"
    );

    const body: ListTrainingsResponse = toListTrainingsResponse(rows);

    return c.json(body);
  })
  .post("/", validate("json", createTrainingRequest), async (c) => {
    const row = await c.var.container.fitness.trainings.create(
      c.req.valid("json")
    );

    const body: CreateTrainingResponse = { id: row.id };

    return c.json(body, 201);
  })
  .patch(
    TRAINING_PATH,
    validate("param", updateTrainingParams),
    validate("json", updateTrainingRequest),
    async (c) => {
      const { trainingId } = c.req.valid("param");
      await c.var.container.fitness.trainings.update(
        trainingId,
        c.req.valid("json")
      );
      const body: UpdateTrainingResponse = { id: trainingId };

      return c.json(body);
    }
  )
  .post(
    `${TRAINING_PATH}/archive`,
    validate("param", archiveTrainingParams),
    async (c) => {
      await c.var.container.fitness.trainings.archive(
        c.req.valid("param").trainingId
      );
      const body: ArchiveTrainingResponse = { ok: true };

      return c.json(body);
    }
  )
  .post(
    `${TRAINING_PATH}/restore`,
    validate("param", restoreTrainingParams),
    async (c) => {
      await c.var.container.fitness.trainings.restore(
        c.req.valid("param").trainingId
      );
      const body: RestoreTrainingResponse = { ok: true };

      return c.json(body);
    }
  );
