import { test as setup } from "@playwright/test";

import { AUTH_FILE, DEMO } from "./demo";

/** Sign in once as the demo account; the layout tests reuse the session. */
setup("sign in as the demo account", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(DEMO.email);
  await page.getByLabel("Password").fill(DEMO.password);
  await page.keyboard.press("Enter");
  await page.waitForURL("/");
  await page.context().storageState({ path: AUTH_FILE });
});
