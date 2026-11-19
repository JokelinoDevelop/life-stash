/** The account the seed signs you in as. Re-running the seed replaces this account's household. */
export const DEMO_ACCOUNT = {
  currency: "MKD",
  displayName: "Demo",
  distanceUnit: "km",
  email: "demo@lifestash.dev",
  householdName: "Demo household",
  locale: "en",
  // Local development only; the seed refuses to run against anything but the local D1.
  // oxlint-disable-next-line sonarjs/no-hardcoded-passwords
  password: "lifestash-demo",
  timeZone: "Europe/Skopje",
} as const;
