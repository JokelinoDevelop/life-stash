/// <reference lib="dom" />
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const PAGES = [
  "/",
  "/garage",
  "/garage/history",
  "/garage/catalog",
  "/finances",
  "/finances/transactions",
  "/finances/invoices",
  "/finances/clients",
  "/settings",
  "/settings/finances",
  "/settings/users",
];

const CAR_TABS = ["overview", "timeline", "reminders", "details"];

/**
 * Elements that stick out past the screen edge without a scrolling or
 * clipping parent (a horizontal scroll strip is fine; the page moving
 * sideways is not). Runs in the page, so it is self-contained.
 */
const overflowing = async (page: Page): Promise<string[]> =>
  await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders: string[] = [];

    for (const element of document.querySelectorAll("body *")) {
      const box = element.getBoundingClientRect();
      let clipped = false;

      for (
        let parent = element.parentElement;
        parent !== null && !clipped;
        parent = parent.parentElement
      ) {
        clipped = /auto|scroll|hidden|clip/u.test(
          getComputedStyle(parent).overflowX
        );
      }

      if (
        box.width > 0 &&
        (box.right > width + 1 || box.left < -1) &&
        !clipped
      ) {
        const text = (element.textContent ?? "").trim().slice(0, 40);
        offenders.push(`<${element.tagName.toLowerCase()}> "${text}"`);
      }
    }

    if (document.documentElement.scrollWidth > width) {
      offenders.unshift(
        `page is ${document.documentElement.scrollWidth}px wide on a ${width}px screen`
      );
    }

    return offenders.slice(0, 5);
  });

/** Loaded: a heading is up (car pages show the name in the hero) and no skeleton is left. */
const open = async (page: Page, path: string) => {
  await page.goto(path);
  await expect(page.locator(":is(h1, h2):visible").first()).toBeVisible();
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
};

test.describe("signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("the sign-in screen fits", async ({ page }) => {
    await open(page, "/login");
    expect(await overflowing(page)).toEqual([]);
  });
});

for (const path of PAGES) {
  test(`${path} fits`, async ({ page }) => {
    await open(page, path);
    expect(await overflowing(page)).toEqual([]);
  });
}

for (const tab of CAR_TABS) {
  test(`car ${tab} tab fits`, async ({ page }) => {
    await open(page, "/garage");

    const car = await page
      .locator('main a[href*="/garage/cars/"]')
      .first()
      .getAttribute("href");

    expect(car, "the demo data has a car").not.toBeNull();
    await open(page, `${car}?tab=${tab}`);
    expect(await overflowing(page)).toEqual([]);
  });
}
