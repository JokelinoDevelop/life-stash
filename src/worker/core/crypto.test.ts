import { describe, expect, it } from "vitest";

import {
  fromBase64Url,
  generateRecoveryCode,
  normalizeRecoveryCode,
  sha256Hex,
  toBase64Url,
} from "./crypto";

describe("crypto helpers", () => {
  it("round-trips base64url", () => {
    const bytes = new Uint8Array([0, 1, 250, 251, 252, 253, 254, 255]);
    expect(fromBase64Url(toBase64Url(bytes))).toStrictEqual(bytes);
    expect(toBase64Url(bytes)).not.toMatch(/[+/=]/u);
  });

  it("generates readable recovery codes and normalises user input", () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/u);
    expect(normalizeRecoveryCode(code.toLowerCase().replaceAll("-", " "))).toBe(
      code
    );
  });

  it("hashes with SHA-256", async () => {
    await expect(sha256Hex("abc")).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });
});
