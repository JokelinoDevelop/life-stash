import { describe, expect, it } from "vitest";

import { isBump, nextVersion, parseBumpAnswer } from "./release-version";

describe("nextVersion", () => {
  it("bumps the right part and resets the ones after it", () => {
    expect(nextVersion("1.4.9", "patch")).toBe("1.4.10");
    expect(nextVersion("1.4.9", "minor")).toBe("1.5.0");
    expect(nextVersion("1.4.9", "major")).toBe("2.0.0");
    expect(nextVersion("0.1.0", "patch")).toBe("0.1.1");
  });

  it("refuses anything that isn't plain X.Y.Z", () => {
    expect(nextVersion("1.4", "patch")).toBeNull();
    expect(nextVersion("1.4.9-beta.1", "patch")).toBeNull();
    expect(nextVersion("v1.4.9", "patch")).toBeNull();
    expect(nextVersion("", "patch")).toBeNull();
  });
});

describe("parseBumpAnswer", () => {
  it("defaults to patch and accepts prefixes in any case", () => {
    expect(parseBumpAnswer("")).toBe("patch");
    expect(parseBumpAnswer("  ")).toBe("patch");
    expect(parseBumpAnswer("mi")).toBe("minor");
    expect(parseBumpAnswer("MAJOR")).toBe("major");
    expect(parseBumpAnswer("p")).toBe("patch");
  });

  it("rejects unknown answers", () => {
    expect(parseBumpAnswer("huge")).toBeNull();
  });
});

describe("isBump", () => {
  it("accepts only the three bump names", () => {
    expect(isBump("minor")).toBe(true);
    expect(isBump("mi")).toBe(false);
  });
});
