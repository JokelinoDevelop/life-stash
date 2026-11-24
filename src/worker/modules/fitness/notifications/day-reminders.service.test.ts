// oxlint-disable sonarjs/shorthand-property-grouping -- conflicts with sort-keys in test fixtures
import { describe, expect, it } from "vitest";

import type { PushMessage } from "../../../core/push";
import type { NamedCalendarEntry } from "../sessions/calendar";
import { DayRemindersService } from "./day-reminders.service";

const TODAY = "2026-11-26";

const entry = (
  name: string,
  status: NamedCalendarEntry["status"]
): NamedCalendarEntry => ({
  date: TODAY,
  durationMinutes: null,
  id: null,
  key: name,
  name,
  note: null,
  originalDate: TODAY,
  scheduleId: "r1",
  status,
  title: null,
  trainingId: "t1",
});

const setup = (reminders: boolean, entries: NamedCalendarEntry[]) => {
  const sent: PushMessage[] = [];

  const service = new DayRemindersService({
    calendar: { entries: async () => await Promise.resolve(entries) },
    clock: { today: async () => await Promise.resolve(TODAY) },
    send: async (message) => {
      sent.push(message);
      await Promise.resolve();
    },
    user: {
      preferences: async () =>
        await Promise.resolve({
          fitnessReminders: reminders,
          locale: "en" as const,
          timeZone: "Europe/Skopje",
        }),
    },
  });

  return { sent, service };
};

describe(DayRemindersService, () => {
  it("sends one push listing today's planned trainings", async () => {
    const { sent, service } = setup(true, [
      entry("Leg day", "planned"),
      entry("Run", "planned"),
      entry("Yoga", "done"),
    ]);

    await expect(service.run()).resolves.toBeTruthy();
    expect(sent).toStrictEqual([
      {
        body: "Today: Leg day, Run",
        tag: "fitness-2026-11-26",
        title: "Training today",
        url: "/fitness",
      },
    ]);
  });

  it("stays quiet when reminders are off or nothing is planned", async () => {
    const off = setup(false, [entry("Leg day", "planned")]);
    const empty = setup(true, [entry("Yoga", "skipped")]);

    await expect(off.service.run()).resolves.toBeFalsy();
    await expect(empty.service.run()).resolves.toBeFalsy();
    expect([...off.sent, ...empty.sent]).toStrictEqual([]);
  });
});
