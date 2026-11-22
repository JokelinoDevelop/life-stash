import { z } from "zod";

/** Browser push services (Chrome/Edge/Brave/Samsung, Firefox, Windows, Safari). */
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/u,
  /^(?:[a-z0-9-]+\.)*push\.services\.mozilla\.com$/u,
  /^(?:[a-z0-9-]+\.)*notify\.windows\.com$/u,
  /^(?:[a-z0-9-]+\.)*push\.apple\.com$/u,
];

/** Only real push services: the Worker POSTs to this URL, so it must not be any address. */
const isPushServiceUrl = (value: string): boolean => {
  const url = new URL(value);

  return (
    url.protocol === "https:" &&
    url.port === "" &&
    PUSH_HOSTS.some((host) => host.test(url.hostname))
  );
};

export const subscribePushRequest = z.object({
  endpoint: z
    .url()
    .max(2048)
    .refine(isPushServiceUrl, "Not a push service endpoint"),
  keys: z.object({
    auth: z.string().min(1).max(256),
    p256dh: z.string().min(1).max(256),
  }),
});
