import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { app } from "../../../app";
import { createDb } from "../../../core/db";
import { createTestHousehold } from "../../../test/households";
import { createTestD1 } from "../../../test/sqlite-d1";

const ORIGIN = "http://localhost";

type JsonBody = Record<string, string | number | boolean | null>;

const profileBody = z.object({
  profile: z
    .object({ defaultVatRateBp: z.number(), name: z.string() })
    .nullable(),
});

const clientBody = z.object({
  client: z.object({
    address: z.string().nullable(),
    invoiceLanguage: z.string(),
    taxId: z.string().nullable(),
  }),
});

const idBody = z.object({ id: z.string() });

const read = async <T>(response: Response, schema: z.ZodType<T>) =>
  schema.parse(await response.json());

interface Session {
  cookie: string;
}

const PROFILE = {
  address: "Ulica 1\n1000 Skopje",
  bankName: "Komercijalna banka",
  companyId: null,
  defaultVatRateBp: 1800,
  email: "me@example.com",
  footerNote: null,
  iban: "MK07300000000042425",
  name: "Jane Dev",
  phone: null,
  swift: "KOBSMK2X",
  taxId: null,
  vatRegistered: true,
} satisfies JsonBody;

describe("business profile and client billing details", () => {
  let env = { DB: createTestD1().d1 };
  let alice: Session = { cookie: "" };
  let bob: Session = { cookie: "" };

  const request = async (
    session: Session,
    method: string,
    path: string,
    body?: JsonBody
  ) =>
    await app.request(
      `${ORIGIN}/api/finances${path}`,
      {
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: {
          "content-type": "application/json",
          cookie: session.cookie,
          origin: ORIGIN,
        },
        method,
      },
      env
    );

  beforeEach(async () => {
    env = { DB: createTestD1().d1 };
    const db = createDb(env.DB);
    alice = await createTestHousehold(db, "alice");
    bob = await createTestHousehold(db, "bob");
  });

  it("saves the profile for this household only", async () => {
    const before = await read(
      await request(alice, "GET", "/business-profile"),
      profileBody
    );

    const saved = await request(alice, "PUT", "/business-profile", PROFILE);

    const again = await request(alice, "PUT", "/business-profile", {
      ...PROFILE,
      name: "Jane Dev DOOEL",
    });

    expect(before.profile).toBeNull();
    expect(saved.status).toBe(200);
    expect(again.status).toBe(200);
    await expect(
      read(await request(alice, "GET", "/business-profile"), profileBody)
    ).resolves.toStrictEqual({
      profile: { defaultVatRateBp: 1800, name: "Jane Dev DOOEL" },
    });
    await expect(
      read(await request(bob, "GET", "/business-profile"), profileBody)
    ).resolves.toStrictEqual({ profile: null });
  });

  it("refuses a profile without a name", async () => {
    const response = await request(alice, "PUT", "/business-profile", {
      ...PROFILE,
      name: " ",
    });

    expect(response.status).toBe(400);
  });

  it("stores client billing details and defaults the invoice language", async () => {
    const { id } = await read(
      await request(alice, "POST", "/clients", {
        address: "Main St 1\nBerlin",
        currency: "EUR",
        email: null,
        kind: "client",
        name: "Northwind Labs",
        notes: null,
        paymentTermsDays: 30,
        taxId: "DE123",
      }),
      idBody
    );

    const edit = await request(alice, "PATCH", `/clients/${id}`, {
      invoiceLanguage: "mk",
    });

    const bobEdit = await request(bob, "PATCH", `/clients/${id}`, {
      address: "x",
    });

    expect(edit.status).toBe(200);
    expect(bobEdit.status).toBe(404);
    await expect(
      read(await request(alice, "GET", `/clients/${id}`), clientBody)
    ).resolves.toMatchObject({
      client: {
        address: "Main St 1\nBerlin",
        invoiceLanguage: "mk",
        taxId: "DE123",
      },
    });
  });
});
