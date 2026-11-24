import { and, between, desc, eq, gte, isNotNull, lt, or } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { fitnessSessions } from "../../../db/schema/fitness";

export type SessionRow = typeof fitnessSessions.$inferSelect;

export type NewSession = Pick<
  typeof fitnessSessions.$inferInsert,
  | "trainingId"
  | "title"
  | "scheduleId"
  | "originalDate"
  | "date"
  | "status"
  | "durationMinutes"
  | "note"
>;

export type SessionPatch = Partial<
  Pick<
    SessionRow,
    "trainingId" | "title" | "date" | "status" | "durationMinutes" | "note"
  >
>;

/** The user's stored sessions (`fitness_sessions`), scoped by household and user. */
export class SessionsRepository {
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
      eq(fitnessSessions.householdId, this.#householdId),
      eq(fitnessSessions.userId, this.#userId)
    );
  }

  /** Sessions on a day in the range, plus occurrences of the range that moved out of it. */
  async listForRange(from: string, to: string): Promise<SessionRow[]> {
    return await this.#db
      .select()
      .from(fitnessSessions)
      .where(
        and(
          this.#mine(),
          or(
            between(fitnessSessions.date, from, to),
            and(
              isNotNull(fitnessSessions.scheduleId),
              between(fitnessSessions.originalDate, from, to)
            )
          )
        )
      );
  }

  async findById(sessionId: string): Promise<SessionRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(fitnessSessions)
      .where(and(eq(fitnessSessions.id, sessionId), this.#mine()))
      .limit(1);

    return row;
  }

  async findOccurrence(
    scheduleId: string,
    originalDate: string
  ): Promise<SessionRow | undefined> {
    const [row] = await this.#db
      .select()
      .from(fitnessSessions)
      .where(
        and(
          this.#mine(),
          eq(fitnessSessions.scheduleId, scheduleId),
          eq(fitnessSessions.originalDate, originalDate)
        )
      )
      .limit(1);

    return row;
  }

  /** The last time the training was done before `before`, with a note. */
  async lastNote(
    trainingId: string,
    before: string
  ): Promise<{ date: string; note: string } | undefined> {
    const [row] = await this.#db
      .select({ date: fitnessSessions.date, note: fitnessSessions.note })
      .from(fitnessSessions)
      .where(
        and(
          this.#mine(),
          eq(fitnessSessions.trainingId, trainingId),
          eq(fitnessSessions.status, "done"),
          lt(fitnessSessions.date, before),
          isNotNull(fitnessSessions.note)
        )
      )
      .orderBy(desc(fitnessSessions.date))
      .limit(1);

    return row?.note === null || row === undefined
      ? undefined
      : { date: row.date, note: row.note };
  }

  async insert(values: NewSession): Promise<SessionRow> {
    const [row] = await this.#db
      .insert(fitnessSessions)
      .values({
        ...values,
        householdId: this.#householdId,
        userId: this.#userId,
      })
      .returning();

    if (!row) {
      throw new Error("Session insert returned no row");
    }

    return row;
  }

  async update(sessionId: string, patch: SessionPatch): Promise<void> {
    if (Object.keys(patch).length === 0) {
      return;
    }

    await this.#db
      .update(fitnessSessions)
      .set(patch)
      .where(and(eq(fitnessSessions.id, sessionId), this.#mine()));
  }

  async delete(sessionId: string): Promise<void> {
    await this.#db
      .delete(fitnessSessions)
      .where(and(eq(fitnessSessions.id, sessionId), this.#mine()));
  }

  /** Moves a closed schedule's occurrences from `fromDate` on to its replacement. */
  async reassignSchedule(
    fromScheduleId: string,
    toScheduleId: string,
    fromDate: string
  ): Promise<void> {
    await this.#db
      .update(fitnessSessions)
      .set({ scheduleId: toScheduleId })
      .where(
        and(
          this.#mine(),
          eq(fitnessSessions.scheduleId, fromScheduleId),
          gte(fitnessSessions.originalDate, fromDate)
        )
      );
  }
}

export type SessionsRepositoryPort = Pick<
  SessionsRepository,
  | "listForRange"
  | "findById"
  | "findOccurrence"
  | "lastNote"
  | "insert"
  | "update"
  | "delete"
  | "reassignSchedule"
>;
