import { and, asc, between, eq } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { fitnessWeightEntries } from "../../../db/schema/fitness";

export type WeightRow = typeof fitnessWeightEntries.$inferSelect;

export interface WeightInput {
  date: string;
  weightGrams: number;
  note: string | null;
}

/** The user's body weight log (`fitness_weight_entries`), one entry per day. */
export class WeightRepository {
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
      eq(fitnessWeightEntries.householdId, this.#householdId),
      eq(fitnessWeightEntries.userId, this.#userId)
    );
  }

  async list(from: string, to: string): Promise<WeightRow[]> {
    return await this.#db
      .select()
      .from(fitnessWeightEntries)
      .where(and(this.#mine(), between(fitnessWeightEntries.date, from, to)))
      .orderBy(asc(fitnessWeightEntries.date));
  }

  async findById(entryId: string): Promise<WeightRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(fitnessWeightEntries)
      .where(and(eq(fitnessWeightEntries.id, entryId), this.#mine()))
      .limit(1);

    return row;
  }

  /** One entry per day: logging the same day again replaces it. */
  async upsert(input: WeightInput): Promise<WeightRow> {
    const [row] = await this.#db
      .insert(fitnessWeightEntries)
      .values({
        ...input,
        householdId: this.#householdId,
        userId: this.#userId,
      })
      .onConflictDoUpdate({
        set: { note: input.note, weightGrams: input.weightGrams },
        target: [fitnessWeightEntries.userId, fitnessWeightEntries.date],
      })
      .returning();

    if (!row) {
      throw new Error("Weight upsert returned no row");
    }

    return row;
  }

  async delete(entryId: string): Promise<void> {
    await this.#db
      .delete(fitnessWeightEntries)
      .where(and(eq(fitnessWeightEntries.id, entryId), this.#mine()));
  }
}

export type WeightRepositoryPort = Pick<
  WeightRepository,
  "list" | "findById" | "upsert" | "delete"
>;
