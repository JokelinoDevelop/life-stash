import type { InvoiceIssuerSnapshot } from "@shared/domain/finances/invoice-document";

import { domainError } from "../../../core/errors";
import type { BusinessProfileRepositoryPort } from "./business-profile.repository";

export interface BusinessProfile extends InvoiceIssuerSnapshot {
  bankAddress: string | null;
  bankCountry: string | null;
  defaultVatRateBp: number;
}

export type BusinessProfileInput = BusinessProfile;

/** Your details for invoices: who issues them and where to pay. */
export class BusinessProfileService {
  readonly #repo: BusinessProfileRepositoryPort;

  constructor(repo: BusinessProfileRepositoryPort) {
    this.#repo = repo;
  }

  /** The saved profile, or null before it is first filled in. */
  async get(): Promise<BusinessProfile | null> {
    const row = await this.#repo.find();

    if (!row) {
      return null;
    }

    return {
      address: row.address,
      bankAddress: row.bankAddress,
      bankCountry: row.bankCountry,
      bankName: row.bankName,
      companyId: row.companyId,
      defaultVatRateBp: row.defaultVatRateBp,
      email: row.email,
      footerNote: row.footerNote,
      iban: row.iban,
      name: row.name,
      phone: row.phone,
      swift: row.swift,
      taxId: row.taxId,
      vatRegistered: row.vatRegistered,
    };
  }

  async save(input: BusinessProfileInput): Promise<BusinessProfile> {
    // Not VAT registered: no VAT on new lines either.
    await this.#repo.upsert({
      ...input,
      defaultVatRateBp: input.vatRegistered ? input.defaultVatRateBp : 0,
    });

    const saved = await this.get();

    if (saved === null) {
      throw new Error("Business profile upsert returned no row");
    }

    return saved;
  }

  /** What an issued invoice freezes; refuses when the profile has no name yet. */
  async issuerSnapshot(): Promise<InvoiceIssuerSnapshot> {
    const profile = await this.get();

    if (profile === null || profile.name.trim() === "") {
      throw domainError("finances.profile_incomplete", { field: "profile" });
    }

    const { defaultVatRateBp: _rate, ...snapshot } = profile;

    return snapshot;
  }
}
