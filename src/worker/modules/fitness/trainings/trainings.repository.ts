import { and, asc, eq, isNull } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { fitnessTrainings } from "../../../db/schema/fitness";

export type TrainingRow = typeof fitnessTrainings.$inferSelect;

export type NewTraining = Pick<
  typeof fitnessTrainings.$inferInsert,
  "name" | "description" | "durationMinutes"
>;

export type TrainingPatch = Partial<
  Pick<TrainingRow, "name" | "description" | "durationMinutes" | "archivedAt">
>;

/** The user's own `fitness_trainings` (scoped by household and user). */
export class TrainingsRepository {
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
      eq(fitnessTrainings.householdId, this.#householdId),
      eq(fitnessTrainings.userId, this.#userId)
    );
  }

  async list(includeArchived: boolean): Promise<TrainingRow[]> {
    return await this.#db
      .select()
      .from(fitnessTrainings)
      .where(
        includeArchived
          ? this.#mine()
          : and(this.#mine(), isNull(fitnessTrainings.archivedAt))
      )
      .orderBy(asc(fitnessTrainings.name));
  }

  async findById(trainingId: string): Promise<TrainingRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(fitnessTrainings)
      .where(and(eq(fitnessTrainings.id, trainingId), this.#mine()))
      .limit(1);

    return row;
  }

  async insert(values: NewTraining): Promise<TrainingRow> {
    const [row] = await this.#db
      .insert(fitnessTrainings)
      .values({
        ...values,
        householdId: this.#householdId,
        userId: this.#userId,
      })
      .returning();

    if (!row) {
      throw new Error("Training insert returned no row");
    }

    return row;
  }

  async update(trainingId: string, patch: TrainingPatch): Promise<void> {
    if (Object.keys(patch).length === 0) {
      return;
    }

    await this.#db
      .update(fitnessTrainings)
      .set(patch)
      .where(and(eq(fitnessTrainings.id, trainingId), this.#mine()));
  }
}

export type TrainingsRepositoryPort = Pick<
  TrainingsRepository,
  "list" | "findById" | "insert" | "update"
>;
