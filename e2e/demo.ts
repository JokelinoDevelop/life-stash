/** The seeded demo account (src/worker/db/seed/fixtures/account.ts). */
export const DEMO = {
  email: "demo@lifestash.dev",
  // oxlint-disable-next-line sonarjs/no-hardcoded-passwords
  password: "lifestash-demo",
};

/** Where the signed-in session is kept between the setup and the tests. */
export const AUTH_FILE = "test-results/.auth/demo.json";
