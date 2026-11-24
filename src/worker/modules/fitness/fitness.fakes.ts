import type {
  SessionRow,
  SessionsRepositoryPort,
} from "./sessions/sessions.repository";
/**
 * Test-only: in-memory stand-ins for the Fitness repositories, so services can be tested
 * without a database.
 */
import type {
  ScheduleRow,
  SchedulesRepositoryPort,
} from "./trainings/schedules.repository";
import type {
  TrainingRow,
  TrainingsRepositoryPort,
} from "./trainings/trainings.repository";

// oxlint-disable sonarjs/shorthand-property-grouping -- fakes list their methods alphabetically

const STAMP = "2026-11-24T08:00:00.000Z";

const scope = { householdId: "h1", userId: "u1" };

export const fakeTrainings = (): TrainingsRepositoryPort & {
  rows: TrainingRow[];
} => {
  const rows: TrainingRow[] = [];

  return {
    findById: async (id) =>
      await Promise.resolve(rows.find((row) => row.id === id)),
    insert: async (values) => {
      const row: TrainingRow = {
        ...scope,
        archivedAt: null,
        createdAt: STAMP,
        description: values.description ?? null,
        durationMinutes: values.durationMinutes ?? null,
        id: crypto.randomUUID(),
        name: values.name,
        updatedAt: STAMP,
      };

      rows.push(row);

      return await Promise.resolve(row);
    },
    list: async (includeArchived) =>
      await Promise.resolve(
        rows.filter((row) => includeArchived || row.archivedAt === null)
      ),
    rows,
    update: async (id, patch) => {
      const index = rows.findIndex((row) => row.id === id);
      const current = rows[index];

      if (current !== undefined) {
        rows[index] = { ...current, ...patch };
      }

      await Promise.resolve();
    },
  };
};

export const fakeSchedules = (): SchedulesRepositoryPort & {
  rows: ScheduleRow[];
} => {
  let rows: ScheduleRow[] = [];

  return {
    close: async (id, endDate) => {
      rows = rows.map((row) => (row.id === id ? { ...row, endDate } : row));
      await Promise.resolve();
    },
    delete: async (id) => {
      rows = rows.filter((row) => row.id !== id);
      await Promise.resolve();
    },
    findById: async (id) =>
      await Promise.resolve(rows.find((row) => row.id === id)),
    insert: async (values) => {
      const row: ScheduleRow = {
        ...scope,
        createdAt: STAMP,
        endDate: null,
        id: crypto.randomUUID(),
        startDate: values.startDate,
        trainingId: values.trainingId,
        weekdays: values.weekdays,
      };

      rows.push(row);

      return await Promise.resolve(row);
    },
    listLatest: async () => {
      const seen = new Set<string>();

      return await Promise.resolve(
        rows.toReversed().filter((row) => {
          const fresh = !seen.has(row.trainingId);
          seen.add(row.trainingId);

          return fresh;
        })
      );
    },
    listOverlapping: async (from, to) =>
      await Promise.resolve(
        rows.filter(
          (row) =>
            row.startDate <= to && (row.endDate === null || row.endDate >= from)
        )
      ),
    get rows() {
      return rows;
    },
  };
};

export const fakeSessions = (): SessionsRepositoryPort & {
  rows: SessionRow[];
} => {
  let rows: SessionRow[] = [];

  const update: SessionsRepositoryPort["update"] = async (id, patch) => {
    rows = rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
    await Promise.resolve();
  };

  return {
    delete: async (id) => {
      rows = rows.filter((row) => row.id !== id);
      await Promise.resolve();
    },
    findById: async (id) =>
      await Promise.resolve(rows.find((row) => row.id === id)),
    findOccurrence: async (scheduleId, originalDate) =>
      await Promise.resolve(
        rows.find(
          (row) =>
            row.scheduleId === scheduleId && row.originalDate === originalDate
        )
      ),
    insert: async (values) => {
      const row: SessionRow = {
        ...scope,
        createdAt: STAMP,
        date: values.date,
        durationMinutes: values.durationMinutes ?? null,
        id: crypto.randomUUID(),
        note: values.note ?? null,
        originalDate: values.originalDate ?? null,
        scheduleId: values.scheduleId ?? null,
        status: values.status,
        title: values.title ?? null,
        trainingId: values.trainingId ?? null,
        updatedAt: STAMP,
      };

      rows.push(row);

      return await Promise.resolve(row);
    },
    lastNote: async (trainingId, before) => {
      const [row] = rows
        .filter(
          (item) =>
            item.trainingId === trainingId &&
            item.status === "done" &&
            item.date < before &&
            item.note !== null
        )
        .toSorted((a, b) => b.date.localeCompare(a.date));

      return await Promise.resolve(
        row?.note === null || row === undefined
          ? undefined
          : { date: row.date, note: row.note }
      );
    },
    listForRange: async (from, to) => {
      const within = (date: string | null) =>
        date !== null && date >= from && date <= to;

      return await Promise.resolve(
        rows.filter(
          (row) =>
            within(row.date) ||
            (row.scheduleId !== null && within(row.originalDate))
        )
      );
    },
    reassignSchedule: async (fromId, toId, fromDate) => {
      rows = rows.map((row) =>
        row.scheduleId === fromId &&
        row.originalDate !== null &&
        row.originalDate >= fromDate
          ? { ...row, scheduleId: toId }
          : row
      );
      await Promise.resolve();
    },
    get rows() {
      return rows;
    },
    update,
  };
};

/** A clock stuck on one day. */
export const fixedClock = (today: string) => ({
  today: async () => await Promise.resolve(today),
});
