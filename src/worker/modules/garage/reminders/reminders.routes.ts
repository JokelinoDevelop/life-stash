import { eq } from "drizzle-orm";
import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { conflict } from "../../../core/errors";
import { validate } from "../../../core/validate";
import { garageReminders } from "../../../db/schema/garage";
import { findCar } from "../cars/cars.service";
import { assertWritableCar } from "../visits/visits.service";
import { completeReminder } from "./completion";
import { createReminderRequest } from "./dto/create-reminder.request";
import type { CreateReminderResponse } from "./dto/create-reminder.response";
import { deleteReminderParams } from "./dto/delete-reminder.request";
import type { DeleteReminderResponse } from "./dto/delete-reminder.response";
import { getReminderParams } from "./dto/get-reminder.request";
import type { GetReminderResponse } from "./dto/get-reminder.response";
import { listRemindersQuery } from "./dto/list-reminders.request";
import type { ListRemindersResponse } from "./dto/list-reminders.response";
import {
  skipReminderParams,
  skipReminderRequest,
} from "./dto/skip-reminder.request";
import type { SkipReminderResponse } from "./dto/skip-reminder.response";
import {
  updateReminderParams,
  updateReminderRequest,
} from "./dto/update-reminder.request";
import type { UpdateReminderResponse } from "./dto/update-reminder.response";
import { activeReminders } from "./evaluate";
import {
  assertReminderLinks,
  findReminder,
  recentlyCompleted,
  suggestedItemsFor,
} from "./reminders.service";

const REMINDER_PATH = "/:reminderId";

export const reminderRoutes = new Hono<AppEnv>()
  .get("/", validate("query", listRemindersQuery), async (c) => {
    const { householdId } = c.var.auth;

    const car = await findCar(
      c.var.db,
      householdId,
      c.req.valid("query").carId
    );

    const [active, completed] = await Promise.all([
      activeReminders(c.var.db, householdId, car.id),
      recentlyCompleted(c.var.db, householdId, car.id),
    ]);

    const body: ListRemindersResponse = {
      active: active.reminders.map(({ reminder, evaluation }) => ({
        daysLeft: evaluation.daysLeft,
        dueDate: reminder.dueDate,
        dueOdometerKm: reminder.dueOdometerKm,
        id: reminder.id,
        intervalKm: reminder.intervalKm,
        intervalMonths: reminder.intervalMonths,
        itemId: reminder.itemId,
        kind: reminder.kind,
        kmLeft: evaluation.kmLeft,
        notes: reminder.notes,
        notifiedAt: reminder.notifiedAt,
        packageId: reminder.packageId,
        status: evaluation.status,
        title: reminder.title,
      })),
      completed: completed.map((reminder) => ({
        completedAt: reminder.completedAt ?? "",
        completedExpenseId: reminder.completedExpenseId,
        completedVisitId: reminder.completedVisitId,
        id: reminder.id,
        kind: reminder.kind,
        title: reminder.title,
      })),
      latestOdometerKm: active.odometers.get(car.id)?.latestKm ?? null,
      today: active.today,
    };

    return c.json(body);
  })
  .get(REMINDER_PATH, validate("param", getReminderParams), async (c) => {
    const reminder = await findReminder(
      c.var.db,
      c.var.auth.householdId,
      c.req.valid("param").reminderId
    );

    const body: GetReminderResponse = {
      reminder: {
        carId: reminder.carId,
        completedAt: reminder.completedAt,
        dueDate: reminder.dueDate,
        dueOdometerKm: reminder.dueOdometerKm,
        id: reminder.id,
        intervalKm: reminder.intervalKm,
        intervalMonths: reminder.intervalMonths,
        itemId: reminder.itemId,
        kind: reminder.kind,
        notes: reminder.notes,
        packageId: reminder.packageId,
        title: reminder.title,
      },
      suggestedItems: await suggestedItemsFor(c.var.db, reminder),
    };

    return c.json(body);
  })
  .post("/", validate("json", createReminderRequest), async (c) => {
    const { carId, ...fields } = c.req.valid("json");
    const { householdId } = c.var.auth;
    const car = await findCar(c.var.db, householdId, carId);
    assertWritableCar(car);
    await assertReminderLinks(c.var.db, householdId, fields);

    const [row] = await c.var.db
      .insert(garageReminders)
      .values({ ...fields, carId: car.id, householdId })
      .returning({ id: garageReminders.id });

    const body: CreateReminderResponse = { id: row?.id ?? "" };

    return c.json(body, 201);
  })
  .put(
    REMINDER_PATH,
    validate("param", updateReminderParams),
    validate("json", updateReminderRequest),
    async (c) => {
      const fields = c.req.valid("json");
      const { householdId } = c.var.auth;

      const reminder = await findReminder(
        c.var.db,
        householdId,
        c.req.valid("param").reminderId
      );

      assertWritableCar(await findCar(c.var.db, householdId, reminder.carId));

      if (reminder.completedAt !== null) {
        throw conflict("This reminder is already completed");
      }

      await assertReminderLinks(c.var.db, householdId, fields);

      const targetsChanged =
        fields.dueDate !== reminder.dueDate ||
        fields.dueOdometerKm !== reminder.dueOdometerKm;

      await c.var.db
        .update(garageReminders)
        .set(targetsChanged ? { ...fields, notifiedAt: null } : fields)
        .where(eq(garageReminders.id, reminder.id));
      const body: UpdateReminderResponse = { id: reminder.id };

      return c.json(body);
    }
  )
  .post(
    "/:reminderId/skip",
    validate("param", skipReminderParams),
    validate("json", skipReminderRequest),
    async (c) => {
      const { date, odometerKm } = c.req.valid("json");
      const { householdId } = c.var.auth;

      const reminder = await findReminder(
        c.var.db,
        householdId,
        c.req.valid("param").reminderId
      );

      assertWritableCar(await findCar(c.var.db, householdId, reminder.carId));

      const body: SkipReminderResponse = {
        nextReminderId: await completeReminder(c.var.db, {
          completedAtKm: odometerKm,
          completedOn: date,
          reminderId: reminder.id,
          householdId,
        }),
      };

      return c.json(body);
    }
  )
  .delete(REMINDER_PATH, validate("param", deleteReminderParams), async (c) => {
    const { householdId } = c.var.auth;

    const reminder = await findReminder(
      c.var.db,
      householdId,
      c.req.valid("param").reminderId
    );

    assertWritableCar(await findCar(c.var.db, householdId, reminder.carId));
    await c.var.db
      .delete(garageReminders)
      .where(eq(garageReminders.id, reminder.id));
    const body: DeleteReminderResponse = { ok: true };

    return c.json(body);
  });
