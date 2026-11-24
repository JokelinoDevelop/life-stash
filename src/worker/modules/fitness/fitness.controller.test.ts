// oxlint-disable sonarjs/shorthand-property-grouping -- conflicts with sort-keys in test fixtures
import { addDays, todayInTimeZone } from "@shared/domain/dates";
import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { app } from "../../app";
import { createDb } from "../../core/db";
import { createTestHousehold, createTestMember } from "../../test/households";
import { createTestD1 } from "../../test/sqlite-d1";

const ORIGIN = "http://localhost";

const idBody = z.object({ id: z.string() });

const calendarBody = z.object({
  entries: z.array(
    z.object({
      date: z.string(),
      id: z.string().nullable(),
      key: z.string(),
      name: z.string(),
      note: z.string().nullable(),
      scheduleId: z.string().nullable(),
      status: z.string(),
    })
  ),
  today: z.string(),
});

const occurrenceBody = z.object({
  id: z.string().nullable(),
  previousNote: z.object({ date: z.string(), note: z.string() }).nullable(),
  status: z.string(),
});

const overviewBody = z.object({
  streakWeeks: z.number(),
  todaySessions: z.array(z.object({ name: z.string() })),
  week: z.object({ done: z.number(), scheduled: z.number() }),
  weight: z.object({
    change7Grams: z.number().nullable(),
    latest: z.object({ weightGrams: z.number() }).nullable(),
  }),
});

const trainingsBody = z.object({
  trainings: z.array(
    z.object({ id: z.string(), weekdays: z.array(z.number()) })
  ),
});

const weightBody = z.object({
  entries: z.array(
    z.object({ date: z.string(), id: z.string(), weightGrams: z.number() })
  ),
});

const errorBody = z.object({ error: z.object({ code: z.string() }) });

const read = async <T>(response: Response, schema: z.ZodType<T>) =>
  schema.parse(await response.json());

interface Session {
  cookie: string;
}

const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];

type JsonValue = string | number | boolean | null | number[] | undefined;

type JsonBody = Record<string, JsonValue>;

describe("fitness API", () => {
  let env = { DB: createTestD1().d1 };
  let alice: Session = { cookie: "" };
  let carol: Session = { cookie: "" };
  let bob: Session = { cookie: "" };
  const today = todayInTimeZone("Europe/Skopje");

  const request = async (
    session: Session,
    method: string,
    path: string,
    body?: JsonBody
  ) =>
    await app.request(
      `${ORIGIN}/api/fitness${path}`,
      {
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: {
          "content-type": "application/json",
          cookie: session.cookie,
          origin: ORIGIN,
        },
        method,
      },
      env
    );

  const createTraining = async (session: Session, weekdays = EVERY_DAY) =>
    await read(
      await request(session, "POST", "/trainings", {
        description: "Squats, lunges",
        durationMinutes: 60,
        name: "Leg day",
        weekdays,
      }),
      idBody
    );

  const calendar = async (session: Session, from: string, to: string) =>
    await read(
      await request(session, "GET", `/sessions/calendar?from=${from}&to=${to}`),
      calendarBody
    );

  beforeEach(async () => {
    env = { DB: createTestD1().d1 };
    const db = createDb(env.DB);
    const household = await createTestHousehold(db, "alice");
    alice = household;
    // Carol shares Alice's household; Bob has his own.
    carol = await createTestMember(db, household.householdId, "carol");
    bob = await createTestHousehold(db, "bob");
  });

  it("shows a weekly repeat months ahead without storing anything", async () => {
    await createTraining(alice, [1, 4]);
    const from = addDays(today, 120);
    const result = await calendar(alice, from, addDays(from, 13));

    expect(result.entries).toHaveLength(4);
    expect(result.entries.every((entry) => entry.id === null)).toBeTruthy();
    expect(result.entries[0]?.name).toBe("Leg day");
  });

  it("marks done, skips and moves occurrences; the next one shows the last note", async () => {
    await createTraining(alice);
    const { entries } = await calendar(alice, today, addDays(today, 3));
    const [first, second, third, fourth] = entries;
    const scheduleId = first?.scheduleId ?? "";

    const done = await request(alice, "PUT", "/sessions/occurrence", {
      scheduleId,
      note: "Squats 5x5 @ 100",
      originalDate: first?.date,
      status: "done",
    });

    await request(alice, "PUT", "/sessions/occurrence", {
      scheduleId,
      originalDate: second?.date,
      status: "skipped",
    });
    await request(alice, "PUT", "/sessions/occurrence", {
      scheduleId,
      date: addDays(today, 10),
      originalDate: third?.date,
    });

    const after = await calendar(alice, today, addDays(today, 3));

    expect(done.status).toBe(200);
    expect(
      after.entries.map((entry) => [entry.date, entry.status])
    ).toStrictEqual([
      [first?.date, "done"],
      [second?.date, "skipped"],
      [fourth?.date, "planned"],
    ]);

    const next = await read(
      await request(
        alice,
        "GET",
        `/sessions/occurrence?scheduleId=${scheduleId}&originalDate=${fourth?.date}`
      ),
      occurrenceBody
    );

    expect(next.previousNote?.note).toBe("Squats 5x5 @ 100");

    const overview = await read(
      await request(alice, "GET", "/overview"),
      overviewBody
    );

    expect([
      overview.todaySessions.map((entry) => entry.name),
      overview.week.done,
    ]).toStrictEqual([["Leg day"], 1]);
  });

  it("logs and edits unplanned sessions, and refuses a session with no name", async () => {
    const missing = await request(alice, "POST", "/sessions", {
      date: today,
      durationMinutes: 30,
      note: null,
      status: "done",
      title: null,
      trainingId: null,
    });

    const failure = await read(missing, errorBody);

    expect([missing.status, failure.error.code]).toStrictEqual([
      400,
      "fitness.session_needs_training",
    ]);

    const { id } = await read(
      await request(alice, "POST", "/sessions", {
        date: today,
        durationMinutes: 30,
        note: "Easy pace",
        status: "done",
        title: "Run",
        trainingId: null,
      }),
      idBody
    );

    await request(alice, "PATCH", `/sessions/${id}`, {
      date: addDays(today, -1),
    });

    const { entries } = await calendar(alice, addDays(today, -1), today);

    expect(entries.map((entry) => [entry.name, entry.date])).toStrictEqual([
      ["Run", addDays(today, -1)],
    ]);

    await request(alice, "DELETE", `/sessions/${id}`);

    const afterDelete = await calendar(alice, addDays(today, -1), today);

    expect(afterDelete.entries).toStrictEqual([]);
  });

  it("changing weekdays keeps the training's id and replaces the repeat", async () => {
    const { id } = await createTraining(alice, [1]);
    await request(alice, "PATCH", `/trainings/${id}`, { weekdays: [2, 6] });

    const { trainings } = await read(
      await request(alice, "GET", "/trainings"),
      trainingsBody
    );

    expect(trainings).toStrictEqual([
      expect.objectContaining({ id, weekdays: [2, 6] }),
    ]);

    await request(alice, "POST", `/trainings/${id}/archive`);
    const later = await calendar(alice, addDays(today, 1), addDays(today, 14));

    expect(later.entries).toStrictEqual([]);
  });

  it("keeps one weight entry per day and reports the change", async () => {
    await request(alice, "PUT", "/weight", {
      date: addDays(today, -7),
      note: null,
      weightGrams: 82_000,
    });
    await request(alice, "PUT", "/weight", {
      date: today,
      note: null,
      weightGrams: 81_500,
    });
    await request(alice, "PUT", "/weight", {
      date: today,
      note: "After run",
      weightGrams: 81_300,
    });

    const { entries } = await read(
      await request(alice, "GET", "/weight"),
      weightBody
    );

    const overview = await read(
      await request(alice, "GET", "/overview"),
      overviewBody
    );

    expect(entries.map((entry) => entry.weightGrams)).toStrictEqual([
      82_000, 81_300,
    ]);
    expect(overview.weight.change7Grams).toBe(-700);
  });

  it("keeps everything per user, even inside one household", async () => {
    const { id } = await createTraining(alice);
    const { entries } = await calendar(alice, today, today);
    const scheduleId = entries[0]?.scheduleId ?? "";

    const session = await read(
      await request(alice, "PUT", "/sessions/occurrence", {
        scheduleId,
        note: "Mine",
        originalDate: today,
        status: "done",
      }),
      idBody
    );

    const weight = await read(
      await request(alice, "PUT", "/weight", {
        date: today,
        note: null,
        weightGrams: 70_000,
      }),
      idBody
    );

    const expectNoAccess = async (other: Session) => {
      const theirs = await calendar(other, today, today);

      const trainings = await read(
        await request(other, "GET", "/trainings"),
        trainingsBody
      );

      const weights = await read(
        await request(other, "GET", "/weight"),
        weightBody
      );

      expect(theirs.entries).toStrictEqual([]);
      expect(trainings.trainings).toStrictEqual([]);
      expect(weights.entries).toStrictEqual([]);

      const responses = await Promise.all([
        request(other, "GET", `/sessions/${session.id}`),
        request(other, "PATCH", `/sessions/${session.id}`, { note: "Theirs" }),
        request(other, "DELETE", `/sessions/${session.id}`),
        request(other, "PATCH", `/trainings/${id}`, { name: "Hijacked" }),
        request(other, "POST", `/trainings/${id}/archive`),
        request(other, "DELETE", `/weight/${weight.id}`),
        request(other, "PUT", "/sessions/occurrence", {
          scheduleId,
          originalDate: today,
          status: "skipped",
        }),
        request(
          other,
          "GET",
          `/sessions/occurrence?scheduleId=${scheduleId}&originalDate=${today}`
        ),
        request(other, "POST", "/sessions", {
          date: today,
          durationMinutes: null,
          note: null,
          status: "done",
          title: null,
          trainingId: id,
        }),
      ]);

      expect(responses.map((response) => response.status)).toStrictEqual(
        Array.from({ length: responses.length }, () => 404)
      );

      // Logging the same day as Alice stays separate.
      const own = await request(other, "PUT", "/weight", {
        date: today,
        note: null,
        weightGrams: 60_000,
      });

      expect(own.status).toBe(200);
    };

    await expectNoAccess(carol);
    await expectNoAccess(bob);

    const mine = await read(
      await request(alice, "GET", `/sessions/${session.id}`),
      occurrenceBody
    );

    const myWeight = await read(
      await request(alice, "GET", "/weight"),
      weightBody
    );

    expect(mine.status).toBe("done");
    expect(myWeight.entries.map((entry) => entry.weightGrams)).toStrictEqual([
      70_000,
    ]);
  });

  it("stores the training reminders switch on the user", async () => {
    await request(alice, "PUT", "/settings", { reminders: false });

    const settingsBody = z.object({ reminders: z.boolean() });

    const mine = await read(
      await request(alice, "GET", "/settings"),
      settingsBody
    );

    const carols = await read(
      await request(carol, "GET", "/settings"),
      settingsBody
    );

    expect(mine.reminders).toBeFalsy();
    expect(carols.reminders).toBeTruthy();
  });
});
