import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { households, users } from "./core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const now = () => new Date().toISOString();

const createdAt = () => text("created_at").notNull().$defaultFn(now);

const updatedAt = () =>
  text("updated_at").notNull().$defaultFn(now).$onUpdateFn(now);

const householdId = () =>
  text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" });

/** Fitness is personal: every row belongs to one user (and that user's household). */
const userId = () =>
  text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

export const SESSION_STATUSES = ["planned", "done", "skipped"] as const;

export const fitnessTrainings = sqliteTable(
  "fitness_trainings",
  {
    archivedAt: text("archived_at"),
    createdAt: createdAt(),
    description: text("description"),
    durationMinutes: integer("duration_minutes"),
    householdId: householdId(),
    id: id(),
    name: text("name").notNull(),
    updatedAt: updatedAt(),
    userId: userId(),
  },
  (table) => [
    index("fitness_trainings_user_idx").on(table.householdId, table.userId),
  ]
);

/** A weekly repeat of one training. Changing weekdays closes this row and opens a new one. */
export const fitnessSchedules = sqliteTable(
  "fitness_schedules",
  {
    createdAt: createdAt(),
    endDate: text("end_date"),
    householdId: householdId(),
    id: id(),
    startDate: text("start_date").notNull(),
    trainingId: text("training_id")
      .notNull()
      .references(() => fitnessTrainings.id, { onDelete: "cascade" }),
    userId: userId(),
    /** ISO weekdays, 1 = Monday … 7 = Sunday. */
    weekdays: text("weekdays", { mode: "json" }).$type<number[]>().notNull(),
  },
  (table) => [
    index("fitness_schedules_user_idx").on(table.householdId, table.userId),
    index("fitness_schedules_training_idx").on(table.trainingId),
  ]
);

/**
 * A planned, done or skipped session. Weekly occurrences are only stored once touched
 * (`schedule_id` + `original_date`); one-offs and unplanned sessions are always stored.
 */
export const fitnessSessions = sqliteTable(
  "fitness_sessions",
  {
    createdAt: createdAt(),
    date: text("date").notNull(),
    durationMinutes: integer("duration_minutes"),
    householdId: householdId(),
    id: id(),
    note: text("note"),
    /** The schedule occurrence this row stands for (it may have moved to `date`). */
    originalDate: text("original_date"),
    scheduleId: text("schedule_id").references(() => fitnessSchedules.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: SESSION_STATUSES }).notNull(),
    /** Free-form name when there is no training. */
    title: text("title"),
    trainingId: text("training_id").references(() => fitnessTrainings.id, {
      onDelete: "cascade",
    }),
    updatedAt: updatedAt(),
    userId: userId(),
  },
  (table) => [
    index("fitness_sessions_date_idx").on(
      table.householdId,
      table.userId,
      table.date
    ),
    index("fitness_sessions_training_idx").on(table.trainingId, table.date),
    uniqueIndex("fitness_sessions_occurrence_idx")
      .on(table.scheduleId, table.originalDate)
      .where(sql`${table.scheduleId} is not null`),
  ]
);

export const fitnessWeightEntries = sqliteTable(
  "fitness_weight_entries",
  {
    createdAt: createdAt(),
    date: text("date").notNull(),
    householdId: householdId(),
    id: id(),
    note: text("note"),
    userId: userId(),
    weightGrams: integer("weight_grams").notNull(),
  },
  (table) => [
    uniqueIndex("fitness_weight_entries_day_idx").on(table.userId, table.date),
  ]
);
