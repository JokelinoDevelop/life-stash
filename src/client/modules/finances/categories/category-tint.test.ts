import { CATEGORY_ICONS } from "@shared/domain/finances/kinds";
import { describe, expect, it } from "vitest";

import { TINTS } from "@/components/app/tint";

import { categoryTint } from "./category-tint";

describe(categoryTint, () => {
  it("gives common categories a colour", () => {
    expect(categoryTint("shopping-cart")).toBe("green");
    expect(categoryTint("coffee")).toBe("orange");
    expect(categoryTint("zap")).toBe("amber");
  });

  it("falls back to slate for unknown or missing icons", () => {
    expect(categoryTint(null)).toBe("slate");
    expect(categoryTint("not-an-icon")).toBe("slate");
  });

  it("maps every icon to a palette tint", () => {
    for (const icon of CATEGORY_ICONS) {
      expect(TINTS).toContain(categoryTint(icon));
    }
  });
});
