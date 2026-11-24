import { deriveStatus, expandSchedule } from "@shared/domain/fitness/schedule";
import type {
  CalendarStatus,
  StoredStatus,
} from "@shared/domain/fitness/schedule";

import { domainError, notFound } from "../../../core/errors";
import type { SchedulesRepositoryPort } from "../trainings/schedules.repository";
import type { TrainingsService } from "../trainings/trainings.service";
import type { FitnessClockPort } from "../user/clock";
import type { CalendarPort, NamedCalendarEntry } from "./calendar";
import type {
  SessionPatch,
  SessionRow,
  SessionsRepositoryPort,
} from "./sessions.repository";

export interface LastNote {
  date: string;
  note: string;
}

export interface SessionDetail {
  /** Null for an occurrence nobody has touched yet. */
  id: string | null;
  scheduleId: string | null;
  originalDate: string | null;
  trainingId: string | null;
  name: string;
  title: string | null;
  date: string;
  status: CalendarStatus;
  durationMinutes: number | null;
  note: string | null;
  /** The note from the last time this training was done. */
  previousNote: LastNote | null;
}

export interface CreateSessionInput {
  trainingId: string | null;
  title: string | null;
  date: string;
  status: StoredStatus;
  durationMinutes: number | null;
  note: string | null;
}

export interface OccurrenceInput {
  scheduleId: string;
  originalDate: string;
  status?: StoredStatus;
  date?: string;
  durationMinutes?: number | null;
  note?: string | null;
}

export type UpdateSessionInput = Partial<CreateSessionInput>;

/** Sessions on the calendar: one-offs, unplanned ones and touched weekly occurrences. */
export class SessionsService {
  readonly #repo: SessionsRepositoryPort;
  readonly #schedules: Pick<SchedulesRepositoryPort, "findById">;
  readonly #trainings: Pick<TrainingsService, "requireForSession">;
  readonly #calendar: CalendarPort;
  readonly #clock: FitnessClockPort;

  constructor(deps: {
    repo: SessionsRepositoryPort;
    schedules: Pick<SchedulesRepositoryPort, "findById">;
    trainings: Pick<TrainingsService, "requireForSession">;
    calendar: CalendarPort;
    clock: FitnessClockPort;
  }) {
    this.#repo = deps.repo;
    this.#schedules = deps.schedules;
    this.#trainings = deps.trainings;
    this.#calendar = deps.calendar;
    this.#clock = deps.clock;
  }

  async calendar(
    from: string,
    to: string
  ): Promise<{ today: string; entries: NamedCalendarEntry[] }> {
    const today = await this.#clock.today();

    return { entries: await this.#calendar.entries(from, to, today), today };
  }

  async lastNote(trainingId: string, before: string): Promise<LastNote | null> {
    return (await this.#repo.lastNote(trainingId, before)) ?? null;
  }

  async #detail(row: SessionRow, today: string): Promise<SessionDetail> {
    const training =
      row.trainingId === null
        ? undefined
        : await this.#trainings.requireForSession(
            row.trainingId,
            row.trainingId
          );

    return {
      date: row.date,
      durationMinutes: row.durationMinutes,
      id: row.id,
      name: training?.name ?? row.title ?? "",
      note: row.note,
      originalDate: row.originalDate,
      previousNote:
        row.trainingId === null
          ? null
          : await this.lastNote(row.trainingId, row.date),
      scheduleId: row.scheduleId,
      status: deriveStatus(row.status, row.date, today),
      title: row.title,
      trainingId: row.trainingId,
    };
  }

  async get(sessionId: string): Promise<SessionDetail> {
    const [row, today] = await Promise.all([
      this.#repo.findById(sessionId),
      this.#clock.today(),
    ]);

    if (!row) {
      throw notFound();
    }

    return await this.#detail(row, today);
  }

  /** A schedule's occurrence, refusing a date the rule doesn't fall on. */
  async #requireOccurrence(scheduleId: string, originalDate: string) {
    const schedule = await this.#schedules.findById(scheduleId);

    if (!schedule) {
      throw notFound();
    }

    if (expandSchedule(schedule, originalDate, originalDate).length === 0) {
      throw domainError("fitness.not_an_occurrence", {
        field: "originalDate",
        status: 400,
      });
    }

    return schedule;
  }

  /** One occurrence of a weekly repeat, touched or not. */
  async occurrence(
    scheduleId: string,
    originalDate: string
  ): Promise<SessionDetail> {
    const [schedule, stored, today] = await Promise.all([
      this.#requireOccurrence(scheduleId, originalDate),
      this.#repo.findOccurrence(scheduleId, originalDate),
      this.#clock.today(),
    ]);

    if (stored !== undefined) {
      return await this.#detail(stored, today);
    }

    const training = await this.#trainings.requireForSession(
      schedule.trainingId,
      schedule.trainingId
    );

    const previousNote = await this.lastNote(schedule.trainingId, originalDate);

    return {
      originalDate,
      previousNote,
      scheduleId,
      date: originalDate,
      durationMinutes: null,
      id: null,
      name: training.name,
      note: null,
      status: deriveStatus("planned", originalDate, today),
      title: null,
      trainingId: schedule.trainingId,
    };
  }

  async #requireTrainingOrTitle(
    trainingId: string | null,
    title: string | null,
    currentTrainingId: string | null
  ) {
    if (trainingId !== null) {
      await this.#trainings.requireForSession(trainingId, currentTrainingId);

      return;
    }

    if (title === null || title.trim() === "") {
      throw domainError("fitness.session_needs_training", {
        field: "title",
        status: 400,
      });
    }
  }

  /** A one-off on the plan, or an unplanned session logged after the fact. */
  async create(input: CreateSessionInput): Promise<SessionRow> {
    await this.#requireTrainingOrTitle(input.trainingId, input.title, null);

    return await this.#repo.insert({
      ...input,
      originalDate: null,
      scheduleId: null,
      title: input.trainingId === null ? input.title : null,
    });
  }

  /** Done / skipped / moved / note on a weekly occurrence: writes its row the first time. */
  async putOccurrence(input: OccurrenceInput): Promise<SessionRow> {
    const { scheduleId, originalDate, ...changes } = input;

    const [schedule, stored] = await Promise.all([
      this.#requireOccurrence(scheduleId, originalDate),
      this.#repo.findOccurrence(scheduleId, originalDate),
    ]);

    if (stored !== undefined) {
      await this.#repo.update(stored.id, changes);

      return { ...stored, ...changes };
    }

    return await this.#repo.insert({
      originalDate,
      scheduleId,
      date: changes.date ?? originalDate,
      durationMinutes: changes.durationMinutes ?? null,
      note: changes.note ?? null,
      status: changes.status ?? "planned",
      title: null,
      trainingId: schedule.trainingId,
    });
  }

  async update(sessionId: string, changes: UpdateSessionInput): Promise<void> {
    const current = await this.#repo.findById(sessionId);

    if (!current) {
      throw notFound();
    }

    const patch: SessionPatch = { ...changes };

    // A weekly occurrence keeps its training; only free-form sessions can change it.
    if (current.scheduleId !== null) {
      delete patch.trainingId;
      delete patch.title;
    } else if (
      changes.trainingId !== undefined ||
      changes.title !== undefined
    ) {
      const trainingId =
        changes.trainingId === undefined
          ? current.trainingId
          : changes.trainingId;

      const title = changes.title === undefined ? current.title : changes.title;
      await this.#requireTrainingOrTitle(trainingId, title, current.trainingId);
      patch.title = trainingId === null ? title : null;
    }

    await this.#repo.update(sessionId, patch);
  }

  /** Removes a session; a weekly occurrence goes back to its plain planned state. */
  async delete(sessionId: string): Promise<void> {
    const current = await this.#repo.findById(sessionId);

    if (!current) {
      throw notFound();
    }

    await this.#repo.delete(sessionId);
  }
}
