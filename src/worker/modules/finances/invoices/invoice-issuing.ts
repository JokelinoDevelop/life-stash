import type {
  InvoiceClientSnapshot,
  InvoiceIssuerSnapshot,
} from "@shared/domain/finances/invoice-document";
import {
  formatInvoiceNumber,
  nextInvoiceSeq,
  parseInvoiceNumber,
} from "@shared/domain/finances/invoices";

import { isUniqueViolation } from "../../../core/db";
import { domainError } from "../../../core/errors";
import type { BusinessProfileService } from "../business-profile/business-profile.service";
import type { ClientRow } from "../clients/clients.repository";
import type { ClientsService } from "../clients/clients.service";
import type { ClockPort } from "../household/clock";
import type { FinanceSettingsService } from "../settings/settings.service";
import type { InvoicesRepositoryPort } from "./invoices.repository";

const NUMBER_TAKEN = "finances.invoice_number_taken";
const NUMBER_FIELD = "number";

/** The columns issuing sets: the number, the frozen details and the status. */
export interface IssuedFields {
  number: string;
  numberYear: number;
  numberSeq: number;
  issuedAt: string;
  sentAt: string;
  status: "sent";
  issuerSnapshot: InvoiceIssuerSnapshot | null;
  clientSnapshot: InvoiceClientSnapshot;
}

const clientSnapshotOf = (client: ClientRow): InvoiceClientSnapshot => ({
  address: client.address,
  email: client.email,
  language: client.invoiceLanguage,
  name: client.name,
  taxId: client.taxId,
});

const takenError = () => domainError(NUMBER_TAKEN, { field: NUMBER_FIELD });

/**
 * Invoice numbers and issuing: `YYYY-NNN` counted per issue year (`NNN` never resets), the
 * next number from the stored sequences, and the details an issued invoice freezes.
 */
export class InvoiceIssuing {
  readonly #repo: Pick<
    InvoicesRepositoryPort,
    "numbered" | "numberTaken" | "seqTaken"
  >;
  readonly #settings: Pick<FinanceSettingsService, "get">;
  readonly #clock: ClockPort;
  readonly #clients: Pick<ClientsService, "requireForEntry">;
  readonly #businessProfile: Pick<
    BusinessProfileService,
    "get" | "issuerSnapshot"
  >;

  constructor(deps: {
    repo: Pick<InvoicesRepositoryPort, "numbered" | "numberTaken" | "seqTaken">;
    settings: Pick<FinanceSettingsService, "get">;
    clock: ClockPort;
    clients: Pick<ClientsService, "requireForEntry">;
    businessProfile: Pick<BusinessProfileService, "get" | "issuerSnapshot">;
  }) {
    this.#repo = deps.repo;
    this.#settings = deps.settings;
    this.#clock = deps.clock;
    this.#clients = deps.clients;
    this.#businessProfile = deps.businessProfile;
  }

  /** The suggested number for `year` (this year by default) and the one it continues from. */
  async nextNumber(
    requestedYear?: number
  ): Promise<{ number: string; previous: string | null }> {
    const [settings, today] = await Promise.all([
      this.#settings.get(),
      this.#clock.today(),
    ]);

    const year = requestedYear ?? Number(today.slice(0, 4));
    const format = settings.invoiceNumberFormat;
    const used = await this.#repo.numbered(format === "NNN" ? null : year);

    return {
      number: formatInvoiceNumber(
        year,
        nextInvoiceSeq(used.map((row) => row.seq)),
        format
      ),
      previous: used[0]?.number ?? null,
    };
  }

  async assertNumberFree(
    number: string,
    exceptId: string | null
  ): Promise<void> {
    if (await this.#repo.numberTaken(number, exceptId)) {
      throw takenError();
    }
  }

  /** Refuses when another live invoice uses this one's number or its sequence (restoring). */
  async assertNumberingFree(
    invoice: {
      number: string | null;
      numberYear: number | null;
      numberSeq: number | null;
    },
    exceptId: string
  ): Promise<void> {
    if (invoice.number !== null) {
      await this.assertNumberFree(invoice.number, exceptId);
    }

    if (
      invoice.numberSeq !== null &&
      (await this.#repo.seqTaken(
        invoice.numberYear,
        invoice.numberSeq,
        exceptId
      ))
    ) {
      throw takenError();
    }
  }

  /**
   * The number an invoice issued on `issueDate` gets: the typed one (must parse and be free)
   * or the next of its year.
   */
  async #numberFor(
    typed: string | null,
    issueDate: string,
    invoiceId: string | null
  ): Promise<Pick<IssuedFields, "number" | "numberSeq" | "numberYear">> {
    const year = Number(issueDate.slice(0, 4));
    const settings = await this.#settings.get();
    const anyYear = settings.invoiceNumberFormat === "NNN";

    if (typed === null) {
      const used = await this.#repo.numbered(anyYear ? null : year);
      const seq = nextInvoiceSeq(used.map((row) => row.seq));

      return {
        number: formatInvoiceNumber(year, seq, settings.invoiceNumberFormat),
        numberSeq: seq,
        numberYear: year,
      };
    }

    const parts = parseInvoiceNumber(typed, year);

    if (parts === null) {
      throw domainError("finances.invoice_number_invalid", {
        field: NUMBER_FIELD,
      });
    }

    const number = typed.trim();
    await this.assertNumberFree(number, invoiceId);

    if (
      await this.#repo.seqTaken(anyYear ? null : year, parts.seq, invoiceId)
    ) {
      throw takenError();
    }

    return { number, numberSeq: parts.seq, numberYear: year };
  }

  async #optionalIssuer(): Promise<InvoiceIssuerSnapshot | null> {
    const profile = await this.#businessProfile.get();

    if (profile === null) {
      return null;
    }

    const { defaultVatRateBp: _rate, ...snapshot } = profile;

    return snapshot;
  }

  /** Everything issuing writes: the number and the frozen issuer / client details. */
  async issuedFields(
    invoice: { clientId: string; issueDate: string; itemised: boolean },
    typed: string | null,
    invoiceId: string | null
  ): Promise<IssuedFields> {
    const client = await this.#clients.requireForEntry(invoice.clientId);

    // Itemised invoices are printed from your profile, so it must exist; recorded ones (made
    // elsewhere) keep a copy only when there is one.
    const issuerSnapshot = invoice.itemised
      ? await this.#businessProfile.issuerSnapshot()
      : await this.#optionalIssuer();

    const numbering = await this.#numberFor(
      typed,
      invoice.issueDate,
      invoiceId
    );

    return {
      ...numbering,
      clientSnapshot: clientSnapshotOf(client),
      issuedAt: this.#clock.now().toISOString(),
      issuerSnapshot,
      sentAt: await this.#clock.today(),
      status: "sent",
    };
  }
}

/** A parallel issue can grab the same number between the check and the write. */
export const guardNumberRace = async <T>(
  write: () => Promise<T>
): Promise<T> => {
  try {
    return await write();
  } catch (error) {
    if (error instanceof Error && isUniqueViolation(error)) {
      throw takenError();
    }

    throw error;
  }
};
