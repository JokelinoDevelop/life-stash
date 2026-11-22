import { BASIS_POINTS } from "@shared/domain/finances/invoice-document";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull } from "@/lib/form-schemas";

import type { BusinessProfile } from "../../business-profile.queries";
import type { BusinessProfileFormValues } from "./schema";

type SaveBody = InferRequestType<
  (typeof api.finances)["business-profile"]["$put"]
>["json"];

const PERCENT = 100;

/** Basis points → "18" / "5.5" (no trailing zeros). */
const bpToPercent = (bp: number): string =>
  bp === 0 ? "" : String(bp / (BASIS_POINTS / PERCENT));

/** "18" / "5,5" → basis points. */
export const percentToBp = (value: string): number => {
  const trimmed = value.trim().replace(",", ".");

  return trimmed === ""
    ? 0
    : Math.round(Number(trimmed) * (BASIS_POINTS / PERCENT));
};

const EMPTY_PROFILE: BusinessProfile = {
  address: "",
  bankAddress: null,
  bankCountry: null,
  bankName: null,
  companyId: null,
  defaultVatRateBp: 0,
  email: null,
  footerNote: null,
  iban: null,
  name: "",
  phone: null,
  swift: null,
  taxId: null,
  vatRegistered: false,
};

const text = (value: string | null): string => value ?? "";

export const businessProfileToFormValues = (
  saved: BusinessProfile | null
): BusinessProfileFormValues => {
  const profile = saved ?? EMPTY_PROFILE;

  return {
    address: profile.address,
    bankAddress: text(profile.bankAddress),
    bankCountry: text(profile.bankCountry),
    bankName: text(profile.bankName),
    companyId: text(profile.companyId),
    defaultVatRate: bpToPercent(profile.defaultVatRateBp),
    email: text(profile.email),
    footerNote: text(profile.footerNote),
    iban: text(profile.iban),
    name: profile.name,
    phone: text(profile.phone),
    swift: text(profile.swift),
    taxId: text(profile.taxId),
    vatRegistered: profile.vatRegistered,
  };
};

export const businessProfileFormToRequest = (
  values: BusinessProfileFormValues
): SaveBody => ({
  address: values.address.trim(),
  bankAddress: emptyToNull(values.bankAddress),
  bankCountry: emptyToNull(values.bankCountry),
  bankName: emptyToNull(values.bankName),
  companyId: emptyToNull(values.companyId),
  defaultVatRateBp: values.vatRegistered
    ? percentToBp(values.defaultVatRate)
    : 0,
  email: emptyToNull(values.email),
  footerNote: emptyToNull(values.footerNote),
  iban: emptyToNull(values.iban.replaceAll(/\s/gu, "")),
  name: values.name.trim(),
  phone: emptyToNull(values.phone),
  swift: emptyToNull(values.swift),
  taxId: emptyToNull(values.taxId),
  vatRegistered: values.vatRegistered,
});
