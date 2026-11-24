import { addDays } from "@shared/domain/dates";
import { normalizeWeekdays } from "@shared/domain/fitness/schedule";

import { domainError, notFound } from "../../../core/errors";
import type { SessionsRepositoryPort } from "../sessions/sessions.repository";
import type { FitnessClockPort } from "../user/clock";
import type {
  ScheduleRow,
  SchedulesRepositoryPort,
} from "./schedules.repository";
import type {
  TrainingRow,
  TrainingsRepositoryPort,
} from "./trainings.repository";

export interface TrainingInput {
  name: string;
  description: string | null;
  durationMinutes: number | null;
  /** ISO weekdays it repeats on; empty = no weekly repeat. */
  weekdays: number[];
}

export interface TrainingWithWeekdays extends TrainingRow {
  weekdays: number[];
}

const sameDays = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((day, index) => day === b[index]);

/** Training templates and their weekly repeat. Changing the repeat never rewrites the past. */
export class TrainingsService {
  readonly #repo: TrainingsRepositoryPort;
  readonly #schedules: SchedulesRepositoryPort;
  readonly #sessions: Pick<SessionsRepositoryPort, "reassignSchedule">;
  readonly #clock: FitnessClockPort;

  constructor(deps: {
    repo: TrainingsRepositoryPort;
    schedules: SchedulesRepositoryPort;
    sessions: Pick<SessionsRepositoryPort, "reassignSchedule">;
    clock: FitnessClockPort;
  }) {
    this.#repo = deps.repo;
    this.#schedules = deps.schedules;
    this.#sessions = deps.sessions;
    this.#clock = deps.clock;
  }

  /** The schedule that applies from today on, if any. */
  async #current(
    trainingId: string,
    today: string
  ): Promise<ScheduleRow | undefined> {
    const latest = await this.#schedules.listLatest();
    const row = latest.find((schedule) => schedule.trainingId === trainingId);

    return row !== undefined && (row.endDate === null || row.endDate >= today)
      ? row
      : undefined;
  }

  async list(includeArchived: boolean): Promise<TrainingWithWeekdays[]> {
    const [rows, latest, today] = await Promise.all([
      this.#repo.list(includeArchived),
      this.#schedules.listLatest(),
      this.#clock.today(),
    ]);

    const weekdays = new Map<string, number[]>();

    for (const row of latest) {
      if (row.endDate === null || row.endDate >= today) {
        weekdays.set(row.trainingId, row.weekdays);
      }
    }

    return rows.map((row) => ({
      ...row,
      weekdays: weekdays.get(row.id) ?? [],
    }));
  }

  async #get(trainingId: string): Promise<TrainingRow> {
    const row = await this.#repo.findById(trainingId);

    if (!row) {
      throw notFound();
    }

    return row;
  }

  /** A training a session may use: yours and not archived (unless the session already uses it). */
  async requireForSession(
    trainingId: string,
    currentId: string | null = null
  ): Promise<TrainingRow> {
    const row = await this.#repo.findById(trainingId);

    if (!row) {
      throw notFound();
    }

    if (row.archivedAt !== null && row.id !== currentId) {
      throw domainError("fitness.training_archived", { field: "trainingId" });
    }

    return row;
  }

  /**
   * Replaces the weekly repeat from today: the current schedule ends yesterday and a new one
   * starts today, so past occurrences keep their days. Touched occurrences from today on
   * move to the new schedule.
   */
  async #setWeekdays(trainingId: string, input: readonly number[]) {
    const weekdays = normalizeWeekdays(input);
    const today = await this.#clock.today();
    const current = await this.#current(trainingId, today);

    if (current !== undefined && sameDays(current.weekdays, weekdays)) {
      return;
    }

    const next =
      weekdays.length === 0
        ? undefined
        : await this.#schedules.insert({
            startDate: today,
            trainingId,
            weekdays,
          });

    if (current === undefined) {
      return;
    }

    if (next !== undefined) {
      await this.#sessions.reassignSchedule(current.id, next.id, today);
    }

    if (current.startDate >= today) {
      // It never applied to a past day: drop it instead of keeping an empty range.
      await this.#schedules.delete(current.id);

      return;
    }

    await this.#schedules.close(current.id, addDays(today, -1));
  }

  async create(input: TrainingInput): Promise<TrainingRow> {
    const { weekdays, ...values } = input;
    const row = await this.#repo.insert(values);
    await this.#setWeekdays(row.id, weekdays);

    return row;
  }

  async update(
    trainingId: string,
    changes: Partial<TrainingInput>
  ): Promise<void> {
    const current = await this.#get(trainingId);
    const { weekdays, ...values } = changes;

    if (Object.keys(values).length > 0) {
      await this.#repo.update(trainingId, values);
    }

    if (weekdays !== undefined) {
      if (current.archivedAt !== null) {
        throw domainError("fitness.training_archived", { field: "weekdays" });
      }

      await this.#setWeekdays(trainingId, weekdays);
    }
  }

  /** Archives a training and ends its weekly repeat; past sessions stay. */
  async archive(trainingId: string): Promise<void> {
    const current = await this.#get(trainingId);

    if (current.archivedAt !== null) {
      return;
    }

    await this.#setWeekdays(trainingId, []);
    await this.#repo.update(trainingId, {
      archivedAt: new Date().toISOString(),
    });
  }

  /** Brings a training back with the weekdays it last repeated on, from today. */
  async restore(trainingId: string): Promise<void> {
    const current = await this.#get(trainingId);

    if (current.archivedAt === null) {
      return;
    }

    const latest = await this.#schedules.listLatest();
    const last = latest.find((row) => row.trainingId === trainingId);
    await this.#repo.update(trainingId, { archivedAt: null });

    if (last !== undefined) {
      await this.#setWeekdays(trainingId, last.weekdays);
    }
  }
}
