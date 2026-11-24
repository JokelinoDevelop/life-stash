import { buildPushHTTPRequest } from "@pushforge/builder";
import { eq, inArray } from "drizzle-orm";

import { pushSubscriptions, users } from "../db/schema/core";
import type { Db } from "./db";
import type { Bindings } from "./env";

export interface PushMessage {
  title: string;
  body: string;
  /** In-app path opened when the notification is tapped. */
  url: string;
  /** Notifications with the same tag replace each other. */
  tag: string;
}

const GONE_STATUSES = new Set([404, 410]);

export const isPushConfigured = (env: Bindings): boolean =>
  Boolean(env.VAPID_PUBLIC_KEY) && Boolean(env.VAPID_PRIVATE_JWK);

interface StoredSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

const sendOne = async (
  env: Bindings,
  subscription: StoredSubscription,
  message: PushMessage
): Promise<boolean> => {
  const { endpoint, headers, body } = await buildPushHTTPRequest({
    message: {
      adminContact: env.VAPID_SUBJECT ?? "mailto:admin@example.com",
      options: {
        topic: message.tag.slice(0, 32),
        ttl: 86_400,
        urgency: "normal",
      },
      payload: {
        body: message.body,
        tag: message.tag,
        title: message.title,
        url: message.url,
      },
    },
    privateJWK: env.VAPID_PRIVATE_JWK ?? "",
    subscription: {
      endpoint: subscription.endpoint,
      keys: { auth: subscription.auth, p256dh: subscription.p256dh },
    },
  });

  const response = await fetch(endpoint, { body, headers, method: "POST" });

  return !GONE_STATUSES.has(response.status);
};

const subscriptionColumns = {
  auth: pushSubscriptions.auth,
  endpoint: pushSubscriptions.endpoint,
  id: pushSubscriptions.id,
  p256dh: pushSubscriptions.p256dh,
};

/** Sends to each subscription and prunes the ones the push service says are gone. */
const sendToSubscriptions = async (
  env: Bindings,
  db: Db,
  rows: readonly StoredSubscription[],
  message: PushMessage
): Promise<number> => {
  const results = await Promise.allSettled(
    rows.map(async (row) => ({
      alive: await sendOne(env, row, message),
      id: row.id,
    }))
  );

  const goneIds = results.flatMap((result) =>
    result.status === "fulfilled" && !result.value.alive
      ? [result.value.id]
      : []
  );

  if (goneIds.length > 0) {
    await db
      .delete(pushSubscriptions)
      .where(inArray(pushSubscriptions.id, goneIds));
  }

  return results.filter((result) => result.status === "fulfilled").length;
};

/** Sends a notification to every device of every user in a household. */
export const sendPushToHousehold = async (
  env: Bindings,
  db: Db,
  householdId: string,
  message: PushMessage
): Promise<number> => {
  if (!isPushConfigured(env)) {
    return 0;
  }

  const rows = await db
    .select(subscriptionColumns)
    .from(pushSubscriptions)
    .innerJoin(users, eq(users.id, pushSubscriptions.userId))
    .where(eq(users.householdId, householdId));

  return await sendToSubscriptions(env, db, rows, message);
};

/** Sends a notification to every device of one user (personal modules such as Fitness). */
export const sendPushToUser = async (
  env: Bindings,
  db: Db,
  userId: string,
  message: PushMessage
): Promise<number> => {
  if (!isPushConfigured(env)) {
    return 0;
  }

  const rows = await db
    .select(subscriptionColumns)
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  return await sendToSubscriptions(env, db, rows, message);
};
