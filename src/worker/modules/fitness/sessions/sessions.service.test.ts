// oxlint-disable sonarjs/shorthand-property-grouping -- conflicts with sort-keys in test fixtures
import { describe, expect, it } from "vitest";

import { ApiError } from "../../../core/errors";
import {
  fakeSchedules,
  fakeSessions,
  fakeTrainings,
  fixedClock,
} from "../fitness.fakes";
import { TrainingsService } from "../trainings/trainings.service";
import { CalendarReader } from "./calendar";
import { SessionsService } from "./sessions.service";

const TODAY = "2026-11-24";

const codeOf = async (promise: Promise<unknown>): Promise<string> => {
  try {
    await promise;
  } catch (error) {
    return error instanceof ApiError ? error.code : "unknown";
  }

  return "resolved";
};

/** A Mon/Thu "Leg day" repeating since 1 Nov. */
const setup = async () => {
  const trainingsRepo = fakeTrainings();
  const schedules = fakeSchedules();
  const repo = fakeSessions();
  const clock = fixedClock(TODAY);

  const trainings = new TrainingsService({
    clock: fixedClock("2026-11-01"),
    repo: trainingsRepo,
    schedules,
    sessions: repo,
  });

  const training = await trainings.create({
    description: null,
    durationMinutes: 60,
    name: "Leg day",
    weekdays: [1, 4],
  });

  const calendar = new CalendarReader({
    schedules,
    sessions: repo,
    trainings: trainingsRepo,
  });

  const service = new SessionsService({
    calendar,
    clock,
    repo,
    schedules,
    trainings,
  });

  const scheduleId = schedules.rows[0]?.id ?? "";

  return { repo, scheduleId, service, training, trainings };
};

describe(SessionsService, () => {
  it("expands the repeat months ahead and derives missed for past days", async () => {
    const { service } = await setup();
    const now = await service.calendar("2026-11-16", "2026-11-29");

    expect(
      now.entries.map((entry) => [entry.date, entry.status, entry.name])
    ).toStrictEqual([
      ["2026-11-16", "missed", "Leg day"],
      ["2026-11-19", "missed", "Leg day"],
      ["2026-11-23", "missed", "Leg day"],
      ["2026-11-26", "planned", "Leg day"],
    ]);

    const later = await service.calendar("2027-04-01", "2027-04-30");

    expect(later.entries).toHaveLength(9);
  });

  it("writes an occurrence once and updates it after", async () => {
    const { repo, scheduleId, service } = await setup();

    await service.putOccurrence({
      note: "Squats 5x5 @ 100",
      originalDate: "2026-11-23",
      scheduleId,
      status: "done",
    });
    await service.putOccurrence({
      durationMinutes: 70,
      originalDate: "2026-11-23",
      scheduleId,
    });

    expect(repo.rows).toHaveLength(1);
    expect(repo.rows[0]).toMatchObject({
      date: "2026-11-23",
      durationMinutes: 70,
      note: "Squats 5x5 @ 100",
      status: "done",
    });
  });

  it("moves an occurrence to another day without duplicating it", async () => {
    const { scheduleId, service } = await setup();
    await service.putOccurrence({
      date: "2026-11-27",
      originalDate: "2026-11-26",
      scheduleId,
    });

    const { entries } = await service.calendar("2026-11-23", "2026-11-29");

    expect(entries.map((entry) => [entry.date, entry.status])).toStrictEqual([
      ["2026-11-23", "missed"],
      ["2026-11-27", "planned"],
    ]);
  });

  it("refuses a date the repeat doesn't fall on", async () => {
    const { scheduleId, service } = await setup();

    await expect(
      codeOf(
        service.putOccurrence({
          originalDate: "2026-11-25",
          scheduleId,
          status: "done",
        })
      )
    ).resolves.toBe("fitness.not_an_occurrence");
  });

  it("shows the note from the last time the training was done", async () => {
    const { scheduleId, service } = await setup();
    await service.putOccurrence({
      note: "Squats 5x5 @ 100",
      originalDate: "2026-11-19",
      scheduleId,
      status: "done",
    });
    await service.putOccurrence({
      originalDate: "2026-11-23",
      scheduleId,
      status: "done",
    });

    const next = await service.occurrence(scheduleId, "2026-11-26");

    expect(next).toMatchObject({
      id: null,
      previousNote: { date: "2026-11-19", note: "Squats 5x5 @ 100" },
      status: "planned",
    });
  });

  it("needs a training or a title for an unplanned session", async () => {
    const { service, training, trainings } = await setup();

    const base = {
      date: TODAY,
      durationMinutes: null,
      note: null,
      status: "done" as const,
    };

    await expect(
      codeOf(service.create({ ...base, title: null, trainingId: null }))
    ).resolves.toBe("fitness.session_needs_training");

    const free = await service.create({
      ...base,
      title: "Run",
      trainingId: null,
    });

    expect(free.title).toBe("Run");

    await trainings.archive(training.id);

    await expect(
      codeOf(service.create({ ...base, title: null, trainingId: training.id }))
    ).resolves.toBe("fitness.training_archived");
  });
});
