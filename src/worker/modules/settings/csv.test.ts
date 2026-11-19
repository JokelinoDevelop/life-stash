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

  it("neutralises text that would run as a formula, but not numbers", () => {
    expect(toCsv(["a", "b", "c"], [['=HYPERLINK("x")', "@sum", -12.5]])).toBe(
      'a,b,c\r\n"\'=HYPERLINK(""x"")",\'@sum,-12.5'
    );
  });
});
