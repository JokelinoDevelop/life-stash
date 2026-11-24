import {
  expandSchedule,
  mergeOccurrences,
} from "@shared/domain/fitness/schedule";
import type { CalendarEntry } from "@shared/domain/fitness/schedule";

import type { SchedulesRepositoryPort } from "../trainings/schedules.repository";
import type { TrainingsRepositoryPort } from "../trainings/trainings.repository";
import type { SessionsRepositoryPort } from "./sessions.repository";

export interface NamedCalendarEntry extends CalendarEntry {
  /** The training's name, or the free-form title of an unplanned session. */
  name: string;
}

/**
 * Reads the calendar: weekly rules are expanded for the asked range and merged with the
 * stored sessions; nothing is generated ahead.
 */
export class CalendarReader {
  readonly #schedules: Pick<SchedulesRepositoryPort, "listOverlapping">;
  readonly #sessions: Pick<SessionsRepositoryPort, "listForRange">;
  readonly #trainings: Pick<TrainingsRepositoryPort, "list">;

  constructor(deps: {
    schedules: Pick<SchedulesRepositoryPort, "listOverlapping">;
    sessions: Pick<SessionsRepositoryPort, "listForRange">;
    trainings: Pick<TrainingsRepositoryPort, "list">;
  }) {
    this.#schedules = deps.schedules;
    this.#sessions = deps.sessions;
    this.#trainings = deps.trainings;
  }

  async entries(
    from: string,
    to: string,
    today: string
  ): Promise<NamedCalendarEntry[]> {
    const [schedules, stored, trainings] = await Promise.all([
      this.#schedules.listOverlapping(from, to),
      this.#sessions.listForRange(from, to),
      this.#trainings.list(true),
    ]);

    const names = new Map(trainings.map((row) => [row.id, row.name]));

    const virtual = schedules.flatMap((schedule) =>
      expandSchedule(schedule, from, to).map((date) => ({
        date,
        scheduleId: schedule.id,
        trainingId: schedule.trainingId,
      }))
    );

    return mergeOccurrences(virtual, stored, today).flatMap((entry) =>
      entry.date < from || entry.date > to
        ? []
        : [
            {
              ...entry,
              name:
                (entry.trainingId === null
                  ? null
                  : names.get(entry.trainingId)) ??
                entry.title ??
                "",
            },
          ]
    );
  }
}

export type CalendarPort = Pick<CalendarReader, "entries">;
