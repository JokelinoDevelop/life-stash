import { addDays, daysBetween } from "@shared/domain/dates";
import { expandSchedule, isoWeekday } from "@shared/domain/fitness/schedule";
import { kgToGrams } from "@shared/domain/fitness/weight";
import { asc, eq } from "drizzle-orm";

import { users } from "../../schema/core";
import {
  fitnessSchedules,
  fitnessSessions,
  fitnessTrainings,
  fitnessWeightEntries,
} from "../../schema/fitness";
import type { SeedContext } from "../context";
import {
  HISTORY_WEEKS,
  MISSED_WEEKS_AGO,
  RUN_NOTES,
  SKIP_NOTES,
  SKIPPED_WEEKS_AGO,
  SQUAT_START_KG,
  SQUAT_STEP_KG,
  TRAININGS,
  WEIGHT,
} from "../fixtures/fitness";
import { insertRows } from "../insert-rows";
import type { Seeder } from "../seeder";

type SessionRow = typeof fitnessSessions.$inferInsert;

const DAYS_PER_WEEK = 7;

/** The account holder: the household's first member (people join later). */
const accountHolder = async (ctx: SeedContext): Promise<string> => {
  const [row] = await ctx.db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.householdId, ctx.householdId))
    .orderBy(asc(users.createdAt))
    .limit(1);

  if (!row) {
    throw new Error("Fitness seeder needs the demo account");
  }

  return row.id;
};

/**
 * Leg day's past occurrences: mostly done with a squat note that creeps up week by week, one
 * skipped, and a couple left untouched so they show as missed. Nothing ahead is stored.
 */
const legDaySessions = (
  ctx: SeedContext,
  scope: {
    householdId: string;
    userId: string;
    trainingId: string;
    scheduleId: string;
  },
  rule: { weekdays: readonly number[]; startDate: string }
): SessionRow[] => {
  const yesterday = addDays(ctx.today, -1);

  const dates = expandSchedule(
    { ...rule, endDate: null },
    rule.startDate,
    yesterday
  );

  const seenWeeks = new Set<number>();

  return dates.flatMap((date): SessionRow[] => {
    const weeksAgo = Math.ceil(daysBetween(date, ctx.today) / DAYS_PER_WEEK);
    const firstOfWeek = !seenWeeks.has(weeksAgo);
    seenWeeks.add(weeksAgo);

    if (firstOfWeek && MISSED_WEEKS_AGO.includes(weeksAgo)) {
      return [];
    }

    const base = { ...scope, date, originalDate: date };

    if (firstOfWeek && SKIPPED_WEEKS_AGO.includes(weeksAgo)) {
      return [
        { ...base, note: ctx.random.pick(SKIP_NOTES), status: "skipped" },
      ];
    }

    const squat = SQUAT_START_KG + (HISTORY_WEEKS - weeksAgo) * SQUAT_STEP_KG;

    return [
      {
        ...base,
        durationMinutes: ctx.random.int(50, 70),
        note: `Squats 5×5 @ ${squat} kg, RDL 3×8 @ ${squat - 10} kg`,
        status: "done",
      },
    ];
  });
};

/** Saturday upper-body one-offs, a few unplanned runs, and next Saturday on the plan. */
const otherSessions = (
  ctx: SeedContext,
  scope: { householdId: string; userId: string },
  ids: { upperBody: string; mobility: string }
): SessionRow[] => {
  const rows: SessionRow[] = [];
  const SATURDAY = 6;

  const daysToSaturday =
    (SATURDAY - isoWeekday(ctx.today) + DAYS_PER_WEEK) % DAYS_PER_WEEK;

  const nextSaturday = addDays(ctx.today, daysToSaturday || DAYS_PER_WEEK);

  for (let week = 1; week <= HISTORY_WEEKS; week += 1) {
    const saturday = addDays(nextSaturday, -DAYS_PER_WEEK * week);
    const bench = 60 + (HISTORY_WEEKS - week) * 2.5;

    rows.push({
      ...scope,
      date: saturday,
      durationMinutes: ctx.random.int(45, 55),
      note: `Bench 5×5 @ ${bench} kg`,
      status: "done",
      trainingId: ids.upperBody,
    });

    if (ctx.random.chance(0.5)) {
      rows.push({
        ...scope,
        date: addDays(saturday, 1),
        durationMinutes: ctx.random.int(25, 50),
        note: ctx.random.pick(RUN_NOTES),
        status: "done",
        title: "Run",
      });
    }
  }

  rows.push(
    {
      ...scope,
      date: nextSaturday,
      status: "planned",
      trainingId: ids.upperBody,
    },
    {
      ...scope,
      date: addDays(ctx.today, -2),
      durationMinutes: 20,
      status: "done",
      trainingId: ids.mobility,
    }
  );

  return rows;
};

/** ~60 weigh-ins over 90 days, drifting from start to end with a little daily noise. */
const weightRows = (
  ctx: SeedContext,
  scope: { householdId: string; userId: string }
) => {
  const days = new Set<number>();

  while (days.size < WEIGHT.entries) {
    days.add(ctx.random.int(0, WEIGHT.days));
  }

  days.add(0);

  return [...days].map((daysAgo) => {
    const progress = 1 - daysAgo / WEIGHT.days;
    const trend = WEIGHT.startKg + (WEIGHT.endKg - WEIGHT.startKg) * progress;
    const kg = trend + ctx.random.between(-WEIGHT.noiseKg, WEIGHT.noiseKg);

    return {
      ...scope,
      date: addDays(ctx.today, -daysAgo),
      note: daysAgo === 0 ? "Morning, before breakfast" : null,
      weightGrams: kgToGrams(Math.round(kg * 10) / 10),
    };
  });
};

/** Trainings, a weekly Leg day with about 8 weeks of history, other sessions and weigh-ins. */
export const fitnessSeeder: Seeder = {
  name: "fitness",
  run: async (ctx: SeedContext) => {
    const scope = {
      householdId: ctx.householdId,
      userId: await accountHolder(ctx),
    };

    const trainings = await ctx.db
      .insert(fitnessTrainings)
      .values(
        TRAININGS.map((training) => ({
          ...scope,
          description: training.description,
          durationMinutes: training.durationMinutes,
          name: training.name,
        }))
      )
      .returning({ id: fitnessTrainings.id, name: fitnessTrainings.name });

    const idOf = (name: string) => {
      const id = trainings.find((row) => row.name === name)?.id;

      if (id === undefined) {
        throw new Error(`Unknown training "${name}"`);
      }

      return id;
    };

    const [legDay] = TRAININGS;
    const startDate = addDays(ctx.today, -DAYS_PER_WEEK * HISTORY_WEEKS);

    const [schedule] = await ctx.db
      .insert(fitnessSchedules)
      .values({
        ...scope,
        startDate,
        trainingId: idOf("Leg day"),
        weekdays: [...(legDay?.weekdays ?? [])],
      })
      .returning({ id: fitnessSchedules.id });

    if (!schedule) {
      throw new Error("Schedule insert returned no row");
    }

    const sessions = [
      ...legDaySessions(
        ctx,
        { ...scope, scheduleId: schedule.id, trainingId: idOf("Leg day") },
        { startDate, weekdays: legDay?.weekdays ?? [] }
      ),
      ...otherSessions(ctx, scope, {
        mobility: idOf("Mobility"),
        upperBody: idOf("Upper body"),
      }),
    ];

    return {
      sessions: await insertRows(ctx.db, fitnessSessions, sessions),
      trainings: trainings.length,
      weighIns: await insertRows(
        ctx.db,
        fitnessWeightEntries,
        weightRows(ctx, scope)
      ),
    };
  },
};
