import { describe, expect, it } from "vitest";

import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(stored).toMatch(/^pbkdf2-sha256\$100000\$/u);
    await expect(
      verifyPassword("correct horse battery", stored)
    ).resolves.toBeTruthy();
    await expect(verifyPassword("wrong", stored)).resolves.toBeFalsy();
  });

  it("uses a unique salt per hash", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same"),
      hashPassword("same"),
    ]);

    expect(a).not.toBe(b);
  });

  it("rejects malformed hashes and has a well-formed dummy hash", async () => {
    await expect(verifyPassword("x", "garbage")).resolves.toBeFalsy();
    await expect(verifyPassword("x", DUMMY_PASSWORD_HASH)).resolves.toBeFalsy();
  });
});
