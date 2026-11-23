import { describe, expect, it } from "vitest";

import { navDirection } from "./nav-direction";

describe(navDirection, () => {
  it("pushes into a deeper screen", () => {
    expect(navDirection("/garage", "/garage/cars/abc")).toBe("push");
    expect(navDirection("/", "/garage/cars/abc")).toBe("push");
  });

  it("pops back to a shallower screen", () => {
    expect(navDirection("/garage/cars/abc", "/garage")).toBe("pop");
    expect(navDirection("/finances/clients/x", "/finances/clients")).toBe(
      "pop"
    );
  });

  it("cross-fades between siblings", () => {
    expect(navDirection("/garage", "/finances")).toBe("fade");
    expect(navDirection("/finances/invoices/", "/finances/transactions")).toBe(
      "fade"
    );
  });
});
