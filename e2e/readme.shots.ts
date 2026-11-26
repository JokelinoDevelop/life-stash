import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/** The screens the README shows, by file name. `car` is the first demo car's overview. */
const SCREENS = [
  { name: "today", path: "/" },
  { name: "car", path: "car" },
  { name: "finances", path: "/finances" },
  { name: "fitness", path: "/fitness" },
] as const;

/** API calls still in flight on each page (the sidebar badges and household name load apart). */
const pending = new WeakMap<Page, Set<string>>();

const trackApiCalls = (page: Page) => {
  const calls = new Set<string>();
  pending.set(page, calls);
  page.on("request", (request) => {
    if (request.url().includes("/api/")) {
      calls.add(request.url());
    }
  });

  const done = (request: { url: () => string }) => {
    calls.delete(request.url());
  };

  page.on("requestfinished", done);
  page.on("requestfailed", done);
};

/** Loaded: a heading is up, no skeleton is left and no API call is pending; fonts and images settle. */
const open = async (page: Page, path: string) => {
  await page.goto(path);
  await expect(page.locator(":is(h1, h2):visible").first()).toBeVisible();
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await expect.poll(() => pending.get(page)?.size ?? 0).toBe(0);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  // Photos and the car hero are images: wait until every one has loaded.
  await expect
    .poll(
      async () =>
        await page.evaluate(() =>
          [...document.images].every((image) => image.complete)
        )
    )
    .toBe(true);
};

const firstCarPath = async (page: Page): Promise<string> => {
  await open(page, "/garage");

  const href = await page
    .locator('main a[href*="/garage/cars/"]')
    .first()
    .getAttribute("href");

  expect(href, "the demo data has a car").not.toBeNull();

  return `${href ?? "/garage"}?tab=overview`;
};

for (const screen of SCREENS) {
  test(`screenshot: ${screen.name}`, async ({ page }, info) => {
    // Project names are `<device>-<theme>` (playwright.screenshots.config.ts).
    const shot = `${screen.name}-${info.project.name}`;
    trackApiCalls(page);

    const path = screen.path === "car" ? await firstCarPath(page) : screen.path;

    await open(page, path);
    await page.screenshot({
      animations: "disabled",
      caret: "hide",
      path: `docs/screenshots/${shot}.png`,
    });
  });
}
