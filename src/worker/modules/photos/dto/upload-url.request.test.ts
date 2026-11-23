import { describe, expect, it } from "vitest";

import { uploadUrlRequest } from "./upload-url.request";

const OWNER_ID = "6a1f6c3e-8a3f-4c1e-9d8a-2b9e1f0c7d11";

describe("upload-url request", () => {
  it("accepts a photo for a car", () => {
    expect(
      uploadUrlRequest.safeParse({
        contentType: "image/jpeg",
        ownerId: OWNER_ID,
        ownerType: "car",
        sizeBytes: 200_000,
      }).success
    ).toBeTruthy();
  });

  it("rejects a PDF as a car's photo", () => {
    expect(
      uploadUrlRequest.safeParse({
        contentType: "application/pdf",
        ownerId: OWNER_ID,
        ownerType: "car",
        sizeBytes: 200_000,
      }).success
    ).toBeFalsy();
  });
});
