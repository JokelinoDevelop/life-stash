/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import * as z from "zod/mini";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | { url: string; revision: string | null })[];
};

// App shell: cache the built assets so the app opens instantly; data always comes from the API.
precacheAndRoute(self.__WB_MANIFEST);

cleanupOutdatedCaches();

registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api\//u],
  })
);

const skipWaitingMessage = z.union([
  z.literal("SKIP_WAITING"),
  z.object({ type: z.literal("SKIP_WAITING") }),
]);

self.addEventListener("message", (event) => {
  if (skipWaitingMessage.safeParse(event.data).success) {
    void self.skipWaiting();
  }
});

const pushPayload = z.object({
  body: z.optional(z.string()),
  tag: z.optional(z.string()),
  title: z.optional(z.string()),
  url: z.optional(z.string()),
});

type PushPayload = z.infer<typeof pushPayload>;

const notificationData = z.object({ url: z.optional(z.string()) });

const readPayload = (event: PushEvent): PushPayload => {
  try {
    const parsed = pushPayload.safeParse(event.data?.json());

    return parsed.success ? parsed.data : {};
  } catch {
    return { body: event.data?.text() };
  }
};

self.addEventListener("push", (event) => {
  const payload = readPayload(event);
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "LifeStash", {
      badge: "/icons/badge-96.png",
      body: payload.body,
      data: { url: payload.url ?? "/" },
      icon: "/icons/icon-192.png",
      tag: payload.tag,
    })
  );
});

const openTarget = async (target: string) => {
  const windows = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window",
  });

  const existing = windows.find((client) =>
    client.url.startsWith(self.location.origin)
  );

  if (existing) {
    await existing.focus();
    await existing.navigate(target);

    return;
  }

  await self.clients.openWindow(target);
};

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const parsed = notificationData.safeParse(event.notification.data);
  const url = parsed.success ? parsed.data.url : undefined;
  event.waitUntil(openTarget(new URL(url ?? "/", self.location.origin).href));
});
