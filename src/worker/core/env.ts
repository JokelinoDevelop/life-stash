/** Secrets are optional so the app still runs locally without B2 or Web Push configured. */
export interface Secrets {
  B2_ENDPOINT?: string;
  B2_REGION?: string;
  B2_BUCKET?: string;
  B2_KEY_ID?: string;
  B2_APP_KEY?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_JWK?: string;
  VAPID_SUBJECT?: string;
}

/** Bindings that only exist where configured (absent in tests and plain local dev). */
export interface OptionalBindings {
  /** Per-IP limit on sign-in endpoints (`ratelimits` in wrangler.jsonc). */
  AUTH_LIMITER?: RateLimit;
}

export type Bindings = Env & Secrets & OptionalBindings;
