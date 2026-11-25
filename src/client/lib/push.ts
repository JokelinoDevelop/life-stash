import { api, unwrap } from "./api";

export const isPushSupported = (): boolean =>
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

const base64UrlToBytes = (value: string): Uint8Array<ArrayBuffer> => {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  return Uint8Array.from(atob(padded), (char) => char.codePointAt(0) ?? 0);
};

const registration = async (): Promise<ServiceWorkerRegistration> =>
  await navigator.serviceWorker.ready;

export const currentPushSubscription =
  async (): Promise<PushSubscription | null> => {
    if (!isPushSupported()) {
      return null;
    }

    const ready = await registration();

    return await ready.pushManager.getSubscription();
  };

/**
 * Whether this device is subscribed, without waiting for the service worker to
 * become ready (that can take a while, or never happen in development).
 */
export const hasPushSubscription = async (): Promise<boolean> => {
  if (!isPushSupported()) {
    return false;
  }

  const found = await navigator.serviceWorker.getRegistration();

  return (
    found !== undefined && (await found.pushManager.getSubscription()) !== null
  );
};

/** Asks for permission, subscribes this device and stores the subscription on the server. */
export const enablePush = async (
  publicKey: string
): Promise<NotificationPermission> => {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    return permission;
  }

  const ready = await registration();

  const subscription =
    (await ready.pushManager.getSubscription()) ??
    (await ready.pushManager.subscribe({
      applicationServerKey: base64UrlToBytes(publicKey),
      userVisibleOnly: true,
    }));

  const json = subscription.toJSON();
  await unwrap(
    api.settings.push.subscriptions.$post({
      json: {
        endpoint: subscription.endpoint,
        keys: { auth: json.keys?.auth ?? "", p256dh: json.keys?.p256dh ?? "" },
      },
    })
  );

  return "granted";
};

export const disablePush = async (): Promise<void> => {
  const subscription = await currentPushSubscription();

  if (!subscription) {
    return;
  }

  await unwrap(
    api.settings.push.subscriptions.$delete({
      json: { endpoint: subscription.endpoint },
    })
  );
  await subscription.unsubscribe();
};
