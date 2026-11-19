import { describe, expect, it } from "vitest";

import { filterCatalog } from "./filter-catalog";

const items = [
  { archivedAt: null, id: "oil", name: "Engine oil" },
  { archivedAt: null, id: "filter", name: "Oil filter" },
  { archivedAt: null, id: "pads", name: "Brake pads" },
  { archivedAt: "2026-01-01", id: "old", name: "Carburettor" },
];

const packages = [
  { itemIds: ["oil", "filter"], name: "Oil service" },
  { itemIds: ["pads"], name: "Brakes" },
];

describe(filterCatalog, () => {
  it("shows active items and every package with no filter", () => {
    const result = filterCatalog({
      items,
      packages,
      query: "",
      view: "active",
    });

    expect(result.items.map((item) => item.id)).toStrictEqual([
      "oil",
      "filter",
      "pads",
    ]);
    expect(result.packages).toHaveLength(2);
  });

  it("matches case-insensitively and finds packages through their items", () => {
    const result = filterCatalog({
      items,
      packages,
      query: "  PADS ",
      view: "active",
    });

    expect(result.items.map((item) => item.id)).toStrictEqual(["pads"]);
    expect(result.packages.map((pkg) => pkg.name)).toStrictEqual(["Brakes"]);
  });

  it("shows only archived items, and no packages, in the archived view", () => {
    const result = filterCatalog({
      items,
      packages,
      query: "",
      view: "archived",
    });

    expect(result.items.map((item) => item.id)).toStrictEqual(["old"]);
    expect(result.packages).toStrictEqual([]);
  });
});
