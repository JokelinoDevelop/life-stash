import { Hono } from "hono";

import type { AppEnv } from "../../../core/app-env";
import { validate } from "../../../core/validate";
import { createSessionRequest } from "./dto/create-session.request";
import type { CreateSessionResponse } from "./dto/create-session.response";
import { deleteSessionParams } from "./dto/delete-session.request";
import type { DeleteSessionResponse } from "./dto/delete-session.response";
import { getCalendarQuery } from "./dto/get-calendar.request";
import { toGetCalendarResponse } from "./dto/get-calendar.response";
import type { GetCalendarResponse } from "./dto/get-calendar.response";
import { getLastNoteQuery } from "./dto/get-last-note.request";
import { toGetLastNoteResponse } from "./dto/get-last-note.response";
import type { GetLastNoteResponse } from "./dto/get-last-note.response";
import { getOccurrenceQuery } from "./dto/get-occurrence.request";
import { toGetOccurrenceResponse } from "./dto/get-occurrence.response";
import type { GetOccurrenceResponse } from "./dto/get-occurrence.response";
import { getSessionParams } from "./dto/get-session.request";
import { toGetSessionResponse } from "./dto/get-session.response";
import type { GetSessionResponse } from "./dto/get-session.response";
import { putOccurrenceRequest } from "./dto/put-occurrence.request";
import type { PutOccurrenceResponse } from "./dto/put-occurrence.response";
import {
  updateSessionParams,
  updateSessionRequest,
} from "./dto/update-session.request";
import type { UpdateSessionResponse } from "./dto/update-session.response";

const SESSION_PATH = "/:sessionId";

export const sessionsController = new Hono<AppEnv>()
  .get("/calendar", validate("query", getCalendarQuery), async (c) => {
    const { from, to } = c.req.valid("query");
    const result = await c.var.container.fitness.sessions.calendar(from, to);
    const body: GetCalendarResponse = toGetCalendarResponse(result);

    return c.json(body);
  })
  .get("/occurrence", validate("query", getOccurrenceQuery), async (c) => {
    const { scheduleId, originalDate } = c.req.valid("query");

    const detail = await c.var.container.fitness.sessions.occurrence(
      scheduleId,
      originalDate
    );

    const body: GetOccurrenceResponse = toGetOccurrenceResponse(detail);

    return c.json(body);
  })
  .put("/occurrence", validate("json", putOccurrenceRequest), async (c) => {
    const row = await c.var.container.fitness.sessions.putOccurrence(
      c.req.valid("json")
    );

    const body: PutOccurrenceResponse = { id: row.id };

    return c.json(body);
  })
  .get("/last-note", validate("query", getLastNoteQuery), async (c) => {
    const { trainingId, before } = c.req.valid("query");

    const note = await c.var.container.fitness.sessions.lastNote(
      trainingId,
      before
    );

    const body: GetLastNoteResponse = toGetLastNoteResponse(note);

    return c.json(body);
  })
  .post("/", validate("json", createSessionRequest), async (c) => {
    const row = await c.var.container.fitness.sessions.create(
      c.req.valid("json")
    );

    const body: CreateSessionResponse = { id: row.id };

    return c.json(body, 201);
  })
  .get(SESSION_PATH, validate("param", getSessionParams), async (c) => {
    const detail = await c.var.container.fitness.sessions.get(
      c.req.valid("param").sessionId
    );

    const body: GetSessionResponse = toGetSessionResponse(detail);

    return c.json(body);
  })
  .patch(
    SESSION_PATH,
    validate("param", updateSessionParams),
    validate("json", updateSessionRequest),
    async (c) => {
      const { sessionId } = c.req.valid("param");
      await c.var.container.fitness.sessions.update(
        sessionId,
        c.req.valid("json")
      );
      const body: UpdateSessionResponse = { id: sessionId };

      return c.json(body);
    }
  )
  .delete(SESSION_PATH, validate("param", deleteSessionParams), async (c) => {
    await c.var.container.fitness.sessions.delete(
      c.req.valid("param").sessionId
    );
    const body: DeleteSessionResponse = { ok: true };

    return c.json(body);
  });
