import type { BusinessProfile } from "../business-profile.service";

export interface GetBusinessProfileResponse {
  /** Null until the profile is first saved. */
  profile: {
    name: string;
    address: string;
    taxId: string | null;
    companyId: string | null;
    email: string | null;
    phone: string | null;
    bankName: string | null;
    bankAddress: string | null;
    bankCountry: string | null;
    iban: string | null;
    swift: string | null;
    vatRegistered: boolean;
    defaultVatRateBp: number;
    footerNote: string | null;
  } | null;
}

export const toGetBusinessProfileResponse = (
  profile: BusinessProfile | null
): GetBusinessProfileResponse => ({
  profile:
    profile === null
      ? null
      : {
          address: profile.address,
          bankAddress: profile.bankAddress,
          bankCountry: profile.bankCountry,
          bankName: profile.bankName,
          companyId: profile.companyId,
          defaultVatRateBp: profile.defaultVatRateBp,
          email: profile.email,
          footerNote: profile.footerNote,
          iban: profile.iban,
          name: profile.name,
          phone: profile.phone,
          swift: profile.swift,
          taxId: profile.taxId,
          vatRegistered: profile.vatRegistered,
        },
});
