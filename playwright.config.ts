import { defineConfig, devices } from "@playwright/test";

import { AUTH_FILE } from "./e2e/demo";

/**
 * Layout checks on phone widths (`pnpm test:layout`). Needs the local app
 * with demo data: `pnpm db:migrate:local && pnpm db:seed`; it reuses a running
 * `pnpm dev` or starts one.
 */
export default defineConfig({
  forbidOnly: process.env.CI !== undefined,
  fullyParallel: true,
  projects: [
    { name: "auth", testMatch: /auth\.setup\.ts/u },
    {
      dependencies: ["auth"],
      name: "iphone",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        storageState: AUTH_FILE,
      },
    },
    {
      dependencies: ["auth"],
      name: "small-phone",
      use: {
        ...devices["Galaxy S9+"],
        storageState: AUTH_FILE,
        viewport: { height: 740, width: 360 },
      },
    },
  ],
  reporter: [["list"]],
  testDir: "e2e",
  use: { baseURL: process.env.LAYOUT_BASE_URL ?? "http://localhost:5173" },
  webServer: {
    command: "pnpm dev",
    reuseExistingServer: true,
    url: "http://localhost:5173/api/version",
  },
});
