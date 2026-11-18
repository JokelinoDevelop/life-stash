import { addDays, todayInTimeZone } from "@shared/domain/dates";
import { and, eq, isNull } from "drizzle-orm";

import { createDb } from "../../core/db";
import type { Db } from "../../core/db";
import type { Bindings } from "../../core/env";
import { sendPushToHousehold } from "../../core/push";
import { households } from "../../db/schema/core";
import { garageCars } from "../../db/schema/garage";
import { householdPrefs } from "./household-prefs";
import { odometerNudgeMessage } from "./notifications";
import { odometerSummaries } from "./odometer";
import { sendReminderHeadsUps } from "./reminders/heads-up";

const DAYS_PER_WEEK = 7;

/** Sends one "log your odometer" nudge per car when no value was logged for N weeks. */
const sendOdometerNudges = async (
  env: Bindings,
  db: Db,
  householdId: string
) => {
  const prefs = await householdPrefs(db, householdId);

  if (prefs.odometerNudgeWeeks <= 0) {
    return;
  }

  const today = todayInTimeZone(prefs.timeZone);
  const threshold = addDays(today, -prefs.odometerNudgeWeeks * DAYS_PER_WEEK);

  const [cars, odometers] = await Promise.all([
    db
      .select()
      .from(garageCars)
      .where(
        and(
          eq(garageCars.householdId, householdId),
          isNull(garageCars.archivedAt)
        )
      ),
    odometerSummaries(db, householdId),
  ]);

  const stale = cars.filter((car) => {
    const lastLogged =
      odometers.get(car.id)?.lastLoggedOn ?? car.createdAt.slice(0, 10);

    const lastNudged = car.odometerNudgedAt?.slice(0, 10) ?? "";

    return lastLogged <= threshold && lastNudged <= threshold;
  });

  await Promise.all(
    stale.map(async (car) => {
      await sendPushToHousehold(
        env,
        db,
        householdId,
        odometerNudgeMessage(prefs, car)
      );
      await db
        .update(garageCars)
        .set({ odometerNudgedAt: new Date().toISOString() })
        .where(eq(garageCars.id, car.id));
    })
  );
};

/** Daily cron: reminder heads-ups and odometer nudges for every household. */
export const runDailySweep = async (env: Bindings): Promise<void> => {
  const db = createDb(env.DB);
  const rows = await db.select({ id: households.id }).from(households);

  await Promise.all(
    rows.map(async ({ id }) => {
      try {
        await sendReminderHeadsUps(env, db, id);
        await sendOdometerNudges(env, db, id);
      } catch (error) {
        console.error("Daily sweep failed for household", id, error);
      }
    })
  );
};
