import { and, asc, desc, eq, gte, isNull, lte, or } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { fitnessSchedules } from "../../../db/schema/fitness";

export type ScheduleRow = typeof fitnessSchedules.$inferSelect;

export type NewSchedule = Pick<
  typeof fitnessSchedules.$inferInsert,
  "trainingId" | "weekdays" | "startDate"
>;

/** The user's weekly repeats (`fitness_schedules`), scoped by household and user. */
export class SchedulesRepository {
  readonly #db: Db;
  readonly #householdId: string;
  readonly #userId: string;

  constructor(db: Db, householdId: string, userId: string) {
    this.#db = db;
    this.#householdId = householdId;
    this.#userId = userId;
  }

  #mine() {
    return and(
      eq(fitnessSchedules.householdId, this.#householdId),
      eq(fitnessSchedules.userId, this.#userId)
    );
  }

  async findById(scheduleId: string): Promise<ScheduleRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(fitnessSchedules)
      .where(and(eq(fitnessSchedules.id, scheduleId), this.#mine()))
      .limit(1);

    return row;
  }

  /** Schedules that apply on at least one day of `from`…`to`. */
  async listOverlapping(from: string, to: string): Promise<ScheduleRow[]> {
    return await this.#db
      .select()
      .from(fitnessSchedules)
      .where(
        and(
          this.#mine(),
          lte(fitnessSchedules.startDate, to),
          or(
            isNull(fitnessSchedules.endDate),
            gte(fitnessSchedules.endDate, from)
          )
        )
      )
      .orderBy(asc(fitnessSchedules.startDate));
  }

  /** Each training's latest schedule (open or closed), newest first. */
  async listLatest(): Promise<ScheduleRow[]> {
    const rows = await this.#db
      .select()
      .from(fitnessSchedules)
      .where(this.#mine())
      .orderBy(
        desc(fitnessSchedules.startDate),
        desc(fitnessSchedules.createdAt)
      );

    const seen = new Set<string>();

    return rows.filter((row) => {
      if (seen.has(row.trainingId)) {
        return false;
      }

      seen.add(row.trainingId);

      return true;
    });
  }

  async insert(values: NewSchedule): Promise<ScheduleRow> {
    const [row] = await this.#db
      .insert(fitnessSchedules)
      .values({
        ...values,
        householdId: this.#householdId,
        userId: this.#userId,
      })
      .returning();

    if (!row) {
      throw new Error("Schedule insert returned no row");
    }

    return row;
  }

  async close(scheduleId: string, endDate: string): Promise<void> {
    await this.#db
      .update(fitnessSchedules)
      .set({ endDate })
      .where(and(eq(fitnessSchedules.id, scheduleId), this.#mine()));
  }

  async delete(scheduleId: string): Promise<void> {
    await this.#db
      .delete(fitnessSchedules)
      .where(and(eq(fitnessSchedules.id, scheduleId), this.#mine()));
  }
}

export type SchedulesRepositoryPort = Pick<
  SchedulesRepository,
  "findById" | "listOverlapping" | "listLatest" | "insert" | "close" | "delete"
>;
