// oxlint-disable sonarjs/shorthand-property-grouping -- conflicts with sort-keys in test fixtures
import { describe, expect, it } from "vitest";

import { ApiError } from "../../../core/errors";
import {
  fakeSchedules,
  fakeSessions,
  fakeTrainings,
  fixedClock,
} from "../fitness.fakes";
import { TrainingsService } from "./trainings.service";

const setup = (today = "2026-11-24") => {
  const repo = fakeTrainings();
  const schedules = fakeSchedules();
  const sessions = fakeSessions();
  const clock = { current: today };

  const service = new TrainingsService({
    clock: { today: async () => await fixedClock(clock.current).today() },
    repo,
    schedules,
    sessions,
  });

  return { clock, repo, schedules, service, sessions };
};

const codeOf = async (promise: Promise<unknown>): Promise<string> => {
  try {
    await promise;
  } catch (error) {
    return error instanceof ApiError ? error.code : "unknown";
  }

  return "resolved";
};

const BASE = { description: null, durationMinutes: 60, name: "Leg day" };

describe(TrainingsService, () => {
  it("opens a weekly repeat from today, with sorted weekdays", async () => {
    const { schedules, service } = setup();
    const row = await service.create({ ...BASE, weekdays: [4, 1, 4] });

    expect(schedules.rows).toMatchObject([
      {
        endDate: null,
        startDate: "2026-11-24",
        trainingId: row.id,
        weekdays: [1, 4],
      },
    ]);
    await expect(service.list(false)).resolves.toMatchObject([
      { name: "Leg day", weekdays: [1, 4] },
    ]);
  });

  it("changing weekdays closes the old schedule yesterday and opens a new one today", async () => {
    const { clock, schedules, service, sessions } = setup("2026-11-01");
    const row = await service.create({ ...BASE, weekdays: [1, 4] });
    const [old] = schedules.rows;

    // A touched future occurrence follows the new schedule.
    await sessions.insert({
      date: "2026-11-30",
      durationMinutes: null,
      note: "Bring straps",
      originalDate: "2026-11-30",
      scheduleId: old?.id ?? "",
      status: "planned",
      title: null,
      trainingId: row.id,
    });

    clock.current = "2026-11-24";
    await service.update(row.id, { weekdays: [2, 5] });

    expect(
      schedules.rows.map((item) => [
        item.startDate,
        item.endDate,
        item.weekdays,
      ])
    ).toStrictEqual([
      ["2026-11-01", "2026-11-23", [1, 4]],
      ["2026-11-24", null, [2, 5]],
    ]);
    expect(sessions.rows[0]?.scheduleId).toBe(schedules.rows[1]?.id);
  });

  it("leaves the schedule alone when the weekdays don't change", async () => {
    const { schedules, service } = setup();
    const row = await service.create({ ...BASE, weekdays: [1, 4] });
    await service.update(row.id, { name: "Legs", weekdays: [4, 1] });

    expect(schedules.rows).toHaveLength(1);
  });

  it("archiving ends the repeat; restoring brings the weekdays back from today", async () => {
    const { clock, repo, schedules, service } = setup("2026-11-01");
    const row = await service.create({ ...BASE, weekdays: [1, 4] });

    clock.current = "2026-11-24";
    await service.archive(row.id);

    expect(repo.rows[0]?.archivedAt).not.toBeNull();
    expect(schedules.rows[0]?.endDate).toBe("2026-11-23");
    await expect(service.list(false)).resolves.toStrictEqual([]);

    clock.current = "2026-12-01";
    await service.restore(row.id);

    expect(schedules.rows.at(-1)).toMatchObject({
      endDate: null,
      startDate: "2026-12-01",
      weekdays: [1, 4],
    });
  });

  it("refuses archived trainings for new sessions", async () => {
    const { service } = setup();
    const row = await service.create({ ...BASE, weekdays: [] });
    await service.archive(row.id);

    await expect(codeOf(service.requireForSession(row.id))).resolves.toBe(
      "fitness.training_archived"
    );
    await expect(
      codeOf(service.requireForSession(row.id, row.id))
    ).resolves.toBe("resolved");
    await expect(
      codeOf(service.requireForSession(crypto.randomUUID()))
    ).resolves.toBe("not_found");
  });
});
