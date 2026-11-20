import type { BusinessProfile } from "../business-profile.service";

export interface UpdateBusinessProfileResponse {
  name: string;
  address: string;
  taxId: string | null;
  companyId: string | null;
  email: string | null;
  phone: string | null;
  bankName: string | null;
  iban: string | null;
  swift: string | null;
  vatRegistered: boolean;
  defaultVatRateBp: number;
  footerNote: string | null;
}

export const toUpdateBusinessProfileResponse = (
  profile: BusinessProfile
): UpdateBusinessProfileResponse => ({
  address: profile.address,
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
});
