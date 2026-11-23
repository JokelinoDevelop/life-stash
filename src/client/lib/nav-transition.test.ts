import { describe, expect, it } from "vitest";

import { navDirection } from "./nav-transition";

describe(navDirection, () => {
  it("pushes into a deeper screen of the same section", () => {
    expect(navDirection("/garage", "/garage/cars/c1")).toBe("push");
    expect(navDirection("/finances", "/finances/transactions")).toBe("push");
  });

  it("pops back up within a section", () => {
    expect(navDirection("/garage/cars/c1", "/garage")).toBe("pop");
  });

  it("fades between tab-bar sections", () => {
    expect(navDirection("/", "/garage")).toBe("tab");
    expect(navDirection("/garage/cars/c1", "/finances")).toBe("tab");
    expect(navDirection("/finances/invoices", "/")).toBe("tab");
  });

  it("pushes a drill-down that starts in another section", () => {
    expect(navDirection("/", "/garage/cars/c1")).toBe("push");
  });

  it("treats going back to a shallower screen as a pop, even across sections", () => {
    expect(navDirection("/garage/cars/c1", "/", true)).toBe("pop");
  });

  it("stays in place for siblings", () => {
    expect(navDirection("/finances/invoices", "/finances/clients")).toBe(
      "same"
    );
    expect(navDirection("/garage/cars/a", "/garage/cars/b")).toBe("same");
  });
});
