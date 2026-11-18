import { describe, expect, it } from "vitest";

import { toCsv } from "./csv";

describe(toCsv, () => {
  it("escapes quotes, commas and newlines", () => {
    expect(
      toCsv(
        ["a", "b"],
        [
          ["x,y", 'say "hi"'],
          [null, 3],
        ]
      )
    ).toBe('a,b\r\n"x,y","say ""hi"""\r\n,3');
  });
});
