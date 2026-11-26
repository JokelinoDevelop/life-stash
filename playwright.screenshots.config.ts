import { defineConfig, devices } from "@playwright/test";

import { AUTH_FILE } from "./e2e/demo";

const DESKTOP = { height: 900, width: 1440 };

/**
 * README screenshots (`pnpm screenshots`) of the seeded demo household, in light and dark, on
 * desktop and phone. Needs the local app with demo data: `pnpm db:migrate:local && pnpm db:seed`;
 * it reuses a running `pnpm dev` or starts one. Writes to docs/screenshots/.
 */
export default defineConfig({
  projects: [
    { name: "auth", testMatch: /auth\.setup\.ts/u },
    ...(["light", "dark"] as const).flatMap((colorScheme) => [
      {
        dependencies: ["auth"],
        name: `desktop-${colorScheme}`,
        testMatch: /readme\.shots\.ts/u,
        use: {
          colorScheme,
          deviceScaleFactor: 2,
          storageState: AUTH_FILE,
          viewport: DESKTOP,
        },
      },
      {
        dependencies: ["auth"],
        name: `phone-${colorScheme}`,
        testMatch: /readme\.shots\.ts/u,
        use: {
          ...devices["iPhone 13"],
          browserName: "chromium" as const,
          colorScheme,
          storageState: AUTH_FILE,
        },
      },
    ]),
  ],
  reporter: [["list"]],
  testDir: "e2e",
  use: {
    baseURL: process.env.LAYOUT_BASE_URL ?? "http://localhost:5173",
    contextOptions: { reducedMotion: "reduce" },
  },
  webServer: {
    command: "pnpm dev",
    reuseExistingServer: true,
    url: "http://localhost:5173/api/version",
  },
});
