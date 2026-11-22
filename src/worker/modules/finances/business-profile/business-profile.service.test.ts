import { describe, expect, it } from "vitest";

import { ApiError } from "../../../core/errors";
import type {
  BusinessProfileRepositoryPort,
  BusinessProfileRow,
} from "./business-profile.repository";
import { BusinessProfileService } from "./business-profile.service";
import type { BusinessProfileInput } from "./business-profile.service";

const fakeProfiles = (): BusinessProfileRepositoryPort => {
  let row: BusinessProfileRow | undefined;

  return {
    find: async () => await Promise.resolve(row),
    upsert: async (values) => {
      row = {
        address: values.address ?? "",
        bankAddress: values.bankAddress ?? null,
        bankCountry: values.bankCountry ?? null,
        bankName: values.bankName ?? null,
        companyId: values.companyId ?? null,
        defaultVatRateBp: values.defaultVatRateBp ?? 0,
        email: values.email ?? null,
        footerNote: values.footerNote ?? null,
        householdId: "h1",
        iban: values.iban ?? null,
        name: values.name,
        phone: values.phone ?? null,
        swift: values.swift ?? null,
        taxId: values.taxId ?? null,
        updatedAt: "2026-11-20T10:00:00.000Z",
        vatRegistered: values.vatRegistered ?? false,
      };
      await Promise.resolve();
    },
  };
};

const INPUT: BusinessProfileInput = {
  address: "Ulica 1\n1000 Skopje",
  bankAddress: "Orce Nikolov 3, Skopje",
  bankCountry: "North Macedonia",
  bankName: "Komercijalna banka",
  companyId: null,
  defaultVatRateBp: 1800,
  email: "me@example.com",
  footerNote: "Not a VAT payer",
  iban: "MK07300000000042425",
  name: "Jane Dev",
  phone: null,
  swift: "KOBSMK2X",
  taxId: "4030000000000",
  vatRegistered: false,
};

describe(BusinessProfileService, () => {
  it("returns null until the profile is saved", async () => {
    await expect(
      new BusinessProfileService(fakeProfiles()).get()
    ).resolves.toBeNull();
  });

  it("drops the default VAT rate when not VAT registered", async () => {
    const service = new BusinessProfileService(fakeProfiles());
    const saved = await service.save(INPUT);

    expect(saved).toMatchObject({ defaultVatRateBp: 0, name: "Jane Dev" });

    await expect(
      service.save({ ...INPUT, vatRegistered: true })
    ).resolves.toMatchObject({ defaultVatRateBp: 1800, vatRegistered: true });
  });

  it("freezes the issuer details, and refuses without a profile", async () => {
    const service = new BusinessProfileService(fakeProfiles());

    await expect(service.issuerSnapshot()).rejects.toMatchObject({
      code: "finances.profile_incomplete",
    });
    await expect(service.issuerSnapshot()).rejects.toBeInstanceOf(ApiError);

    await service.save(INPUT);
    const snapshot = await service.issuerSnapshot();

    expect(snapshot).toStrictEqual({
      address: INPUT.address,
      bankAddress: INPUT.bankAddress,
      bankCountry: INPUT.bankCountry,
      bankName: INPUT.bankName,
      companyId: null,
      email: INPUT.email,
      footerNote: INPUT.footerNote,
      iban: INPUT.iban,
      name: "Jane Dev",
      phone: null,
      swift: INPUT.swift,
      taxId: INPUT.taxId,
      vatRegistered: false,
    });
  });
});
