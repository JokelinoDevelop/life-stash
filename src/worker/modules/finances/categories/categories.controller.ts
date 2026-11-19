import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { createCategoryRequest } from "./dto/create-category.request";
import type { CreateCategoryResponse } from "./dto/create-category.response";
import { deleteCategoryParams } from "./dto/delete-category.request";
import type { DeleteCategoryResponse } from "./dto/delete-category.response";
import { toListCategoriesResponse } from "./dto/list-categories.response";
import type { ListCategoriesResponse } from "./dto/list-categories.response";
import {
  updateCategoryParams,
  updateCategoryRequest,
} from "./dto/update-category.request";
import type { UpdateCategoryResponse } from "./dto/update-category.response";

const CATEGORY_PATH = "/:categoryId";

export const categoriesController = new Hono<AppEnv>()
  .get("/", async (c) => {
    const rows = await c.var.container.finances.categories.list();
    const body: ListCategoriesResponse = toListCategoriesResponse(rows);

    return c.json(body);
  })
  .post("/", validate("json", createCategoryRequest), async (c) => {
    const row = await c.var.container.finances.categories.create(
      c.req.valid("json")
    );

    const body: CreateCategoryResponse = { id: row.id };

    return c.json(body, 201);
  })
  .patch(
    CATEGORY_PATH,
    validate("param", updateCategoryParams),
    validate("json", updateCategoryRequest),
    async (c) => {
      await c.var.container.finances.categories.update(
        c.req.valid("param").categoryId,
        c.req.valid("json")
      );
      const body: UpdateCategoryResponse = { ok: true };

      return c.json(body);
    }
  )
  .delete(CATEGORY_PATH, validate("param", deleteCategoryParams), async (c) => {
    await c.var.container.finances.categories.delete(
      c.req.valid("param").categoryId
    );
    const body: DeleteCategoryResponse = { ok: true };

    return c.json(body);
  });
