import { and, eq, isNull } from "drizzle-orm";

import { Container } from "../../core/container";
import { createDb } from "../../core/db";
import type { Bindings } from "../../core/env";
import { userPreferences } from "../../db/schema/core";
import { fitnessTrainings } from "../../db/schema/fitness";

/**
 * Daily (06:00 UTC): one push per user with a training today, listing them
 * ("Today: Leg day"), for everyone who keeps training reminders on.
 */
export const runFitnessSweep = async (env: Bindings): Promise<void> => {
  const db = createDb(env.DB);

  const users = await db
    .selectDistinct({
      householdId: fitnessTrainings.householdId,
      userId: fitnessTrainings.userId,
    })
    .from(fitnessTrainings)
    .innerJoin(
      userPreferences,
      eq(userPreferences.userId, fitnessTrainings.userId)
    )
    .where(
      and(
        isNull(fitnessTrainings.archivedAt),
        eq(userPreferences.fitnessReminders, true)
      )
    );

  await Promise.all(
    users.map(async ({ householdId, userId }) => {
      const pending: Promise<unknown>[] = [];

      const defer = (work: Promise<unknown>) => {
        pending.push(work);
      };

      try {
        await new Container({
          db,
          defer,
          env,
          householdId,
          userId,
        }).fitness.dayReminders.run();
      } catch (error) {
        console.error("Fitness reminders failed", userId, error);
      }

      await Promise.allSettled(pending);
    })
  );
};
