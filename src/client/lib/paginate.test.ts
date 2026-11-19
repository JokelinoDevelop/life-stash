import { describe, expect, it } from "vitest";

import { paginate } from "./paginate";

const rows = Array.from({ length: 25 }, (_, index) => index + 1);

describe(paginate, () => {
  it("returns the requested page and its range", () => {
    const result = paginate(rows, 2, 10);

    expect(result.items).toStrictEqual([
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ]);
    expect(result).toMatchObject({ end: 20, page: 2, pageCount: 3, start: 11 });
  });

  it("shows a short last page", () => {
    expect(paginate(rows, 3, 10)).toMatchObject({
      end: 25,
      items: [21, 22, 23, 24, 25],
      start: 21,
    });
  });

  it("clamps pages that no longer exist", () => {
    expect(paginate(rows, 9, 10).page).toBe(3);
    expect(paginate(rows, 0, 10).page).toBe(1);
  });

  it("handles an empty list", () => {
    expect(paginate([], 1, 10)).toStrictEqual({
      end: 0,
      items: [],
      page: 1,
      pageCount: 1,
      start: 0,
      total: 0,
    });
  });
});
