import { and, eq } from "drizzle-orm";
import { Hono } from "hono";

import type { AppEnv } from "../../core/app-env";
import { ApiError } from "../../core/errors";
import { isPushConfigured, sendPushToHousehold } from "../../core/push";
import { validate } from "../../core/validate";
import { pushSubscriptions } from "../../db/schema/core";
import { exportCsvParams } from "./dto/export-csv.request";
import type { GetPreferencesResponse } from "./dto/get-preferences.response";
import { subscribePushRequest } from "./dto/subscribe-push.request";
import type { SubscribePushResponse } from "./dto/subscribe-push.response";
import type { TestPushResponse } from "./dto/test-push.response";
import { unsubscribePushRequest } from "./dto/unsubscribe-push.request";
import type { UnsubscribePushResponse } from "./dto/unsubscribe-push.response";
import { updatePreferencesRequest } from "./dto/update-preferences.request";
import type { UpdatePreferencesResponse } from "./dto/update-preferences.response";
import { exportCsv, exportHouseholdJson } from "./export.service";
import { getPreferences, updatePreferences } from "./preferences.service";

const download = (filename: string, contentType: string) => ({
  "Cache-Control": "no-store",
  "Content-Disposition": `attachment; filename="${filename}"`,
  "Content-Type": contentType,
});

export const settingsRoutes = new Hono<AppEnv>()
  .get("/preferences", async (c) => {
    const body: GetPreferencesResponse = await getPreferences(
      c.var.db,
      c.var.auth.userId
    );

    return c.json(body);
  })
  .put(
    "/preferences",
    validate("json", updatePreferencesRequest),
    async (c) => {
      await updatePreferences(c.var.db, c.var.auth.userId, c.req.valid("json"));
      const body: UpdatePreferencesResponse = { ok: true };

      return c.json(body);
    }
  )
  .post(
    "/push/subscriptions",
    validate("json", subscribePushRequest),
    async (c) => {
      const { endpoint, keys } = c.req.valid("json");
      await c.var.db
        .insert(pushSubscriptions)
        .values({
          auth: keys.auth,
          p256dh: keys.p256dh,
          userId: c.var.auth.userId,
          endpoint,
        })
        .onConflictDoUpdate({
          set: {
            auth: keys.auth,
            p256dh: keys.p256dh,
            userId: c.var.auth.userId,
          },
          target: pushSubscriptions.endpoint,
        });
      const body: SubscribePushResponse = { ok: true };

      return c.json(body);
    }
  )
  .delete(
    "/push/subscriptions",
    validate("json", unsubscribePushRequest),
    async (c) => {
      await c.var.db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.endpoint, c.req.valid("json").endpoint),
            eq(pushSubscriptions.userId, c.var.auth.userId)
          )
        );
      const body: UnsubscribePushResponse = { ok: true };

      return c.json(body);
    }
  )
  .post("/push/test", async (c) => {
    if (!isPushConfigured(c.env)) {
      throw new ApiError(
        503,
        "not_configured",
        "Push notifications are not configured"
      );
    }

    const prefs = await getPreferences(c.var.db, c.var.auth.userId);

    const body: TestPushResponse = {
      delivered: await sendPushToHousehold(
        c.env,
        c.var.db,
        c.var.auth.householdId,
        {
          body:
            prefs.locale === "mk"
              ? "Известувањата работат."
              : "Notifications are working.",
          tag: "test",
          title: "LifeStash",
          url: "/settings",
        }
      ),
    };

    return c.json(body);
  })
  .get("/export/json", async (c) => {
    const data = await exportHouseholdJson(c.var.db, c.var.auth.householdId);
    const date = new Date().toISOString().slice(0, 10);

    return c.body(
      JSON.stringify(data, null, 2),
      200,
      download(`lifestash-${date}.json`, "application/json")
    );
  })
  .get(
    "/export/csv/:dataset",
    validate("param", exportCsvParams),
    async (c) => {
      const { dataset } = c.req.valid("param");
      const csv = await exportCsv(c.var.db, c.var.auth.householdId, dataset);

      return c.body(
        `﻿${csv}`,
        200,
        download(`lifestash-${dataset}.csv`, "text/csv; charset=utf-8")
      );
    }
  );
