import { describe, expect, it } from "vitest";

import { isDialogToggle } from "./dialog-scroll";

const at = (
  pathname: string,
  search: { dialog?: string; page?: number } = {}
) => ({
  pathname,
  search,
});

describe(isDialogToggle, () => {
  it("is a toggle when a dialog opens, switches or closes on the same page", () => {
    expect(
      isDialogToggle(at("/finances"), at("/finances", { dialog: "client" }))
    ).toBeTruthy();
    expect(
      isDialogToggle(
        at("/finances", { dialog: "client" }),
        at("/finances", { dialog: "invoice" })
      )
    ).toBeTruthy();
    expect(
      isDialogToggle(at("/finances", { dialog: "client" }), at("/finances"))
    ).toBeTruthy();
  });

  it("is not a toggle across pages or without a dialog", () => {
    expect(
      isDialogToggle(at("/garage"), at("/finances", { dialog: "client" }))
    ).toBeFalsy();
    expect(
      isDialogToggle(at("/finances"), at("/finances", { page: 2 }))
    ).toBeFalsy();
    expect(
      isDialogToggle(undefined, at("/finances", { dialog: "x" }))
    ).toBeFalsy();
  });
});
