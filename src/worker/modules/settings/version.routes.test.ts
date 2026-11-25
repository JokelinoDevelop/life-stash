import { describe, expect, it } from "vitest";

import { app } from "../../app";
import { createTestD1 } from "../../test/sqlite-d1";
import type { GetVersionResponse } from "./dto/get-version.response";

describe("GET /api/version", () => {
  it("reports only the build's version without signing in", async () => {
    const response = await app.request(
      "http://localhost/api/version",
      {},
      { DB: createTestD1() }
    );

    expect(response.status).toBe(200);

    const body: GetVersionResponse = await response.json();

    // vitest.config.ts defines the build constants for tests.
    expect(body).toStrictEqual({ version: "0.0.0-test" });
  });
});
