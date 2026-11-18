import { eq } from "drizzle-orm";
import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { garageExpenses } from "../../../db/schema/garage";
import { deletePhotosOfOwners } from "../../photos/photos.service";
import { findCar } from "../cars/cars.service";
import { findWritableCar } from "../mileage/writable-car";
import { completeReminder } from "../reminders/completion";
import { sendReminderHeadsUps } from "../reminders/heads-up";
import { createExpenseRequest } from "./dto/create-expense.request";
import type { CreateExpenseResponse } from "./dto/create-expense.response";
import { deleteExpenseParams } from "./dto/delete-expense.request";
import type { DeleteExpenseResponse } from "./dto/delete-expense.response";
import { getExpenseParams } from "./dto/get-expense.request";
import { toGetExpenseResponse } from "./dto/get-expense.response";
import type { GetExpenseResponse } from "./dto/get-expense.response";
import { listExpensesQuery } from "./dto/list-expenses.request";
import { toListExpensesResponse } from "./dto/list-expenses.response";
import type { ListExpensesResponse } from "./dto/list-expenses.response";
import {
  updateExpenseParams,
  updateExpenseRequest,
} from "./dto/update-expense.request";
import type { UpdateExpenseResponse } from "./dto/update-expense.response";
import { findExpense, listExpenses } from "./expenses.service";

const EXPENSE_PATH = "/:expenseId";

export const expenseRoutes = new Hono<AppEnv>()
  .get("/", validate("query", listExpensesQuery), async (c) => {
    const { householdId } = c.var.auth;
    const query = c.req.valid("query");
    const car = await findCar(c.var.db, householdId, query.carId);

    const rows = await listExpenses(c.var.db, householdId, {
      carId: car.id,
      year: query.year,
    });

    const body: ListExpensesResponse = toListExpensesResponse(rows);

    return c.json(body);
  })
  .get(EXPENSE_PATH, validate("param", getExpenseParams), async (c) => {
    const expense = await findExpense(
      c.var.db,
      c.var.auth.householdId,
      c.req.valid("param").expenseId
    );

    const body: GetExpenseResponse = toGetExpenseResponse(expense);

    return c.json(body);
  })
  .post("/", validate("json", createExpenseRequest), async (c) => {
    const { reminderId, ...input } = c.req.valid("json");
    const { householdId } = c.var.auth;
    const car = await findWritableCar(c.var.db, householdId, input.carId);
    const expenseId = crypto.randomUUID();
    await c.var.db
      .insert(garageExpenses)
      .values({ ...input, carId: car.id, householdId, id: expenseId });

    const nextReminderId =
      reminderId === null
        ? null
        : await completeReminder(c.var.db, {
            completedAtKm: input.odometerKm,
            completedOn: input.date,
            expenseId,
            householdId,
            reminderId,
          });

    if (input.odometerKm !== null) {
      c.executionCtx.waitUntil(
        sendReminderHeadsUps(c.env, c.var.db, householdId, car.id)
      );
    }

    const body: CreateExpenseResponse = { id: expenseId, nextReminderId };

    return c.json(body, 201);
  })
  .put(
    EXPENSE_PATH,
    validate("param", updateExpenseParams),
    validate("json", updateExpenseRequest),
    async (c) => {
      const input = c.req.valid("json");
      const { householdId } = c.var.auth;

      const expense = await findExpense(
        c.var.db,
        householdId,
        c.req.valid("param").expenseId
      );

      await findWritableCar(c.var.db, householdId, expense.carId);
      await c.var.db
        .update(garageExpenses)
        .set(input)
        .where(eq(garageExpenses.id, expense.id));

      if (input.odometerKm !== null) {
        c.executionCtx.waitUntil(
          sendReminderHeadsUps(c.env, c.var.db, householdId, expense.carId)
        );
      }

      const body: UpdateExpenseResponse = { id: expense.id };

      return c.json(body);
    }
  )
  .delete(EXPENSE_PATH, validate("param", deleteExpenseParams), async (c) => {
    const { householdId } = c.var.auth;

    const expense = await findExpense(
      c.var.db,
      householdId,
      c.req.valid("param").expenseId
    );

    await findWritableCar(c.var.db, householdId, expense.carId);
    await deletePhotosOfOwners(c.env, c.var.db, householdId, {
      ownerIds: [expense.id],
      ownerType: "expense",
    });
    await c.var.db
      .delete(garageExpenses)
      .where(eq(garageExpenses.id, expense.id));
    const body: DeleteExpenseResponse = { ok: true };

    return c.json(body);
  });
