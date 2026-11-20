/** Invoice documents (F4): frozen snapshots, line math and totals. Pure, no I/O. */

export const INVOICE_LANGUAGES = ["en", "mk"] as const;

export type InvoiceLanguage = (typeof INVOICE_LANGUAGES)[number];

/** Your business details as printed on an issued invoice. */
export interface InvoiceIssuerSnapshot {
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
  footerNote: string | null;
}

/** The client's billing details as printed on an issued invoice. */
export interface InvoiceClientSnapshot {
  name: string;
  address: string | null;
  taxId: string | null;
  email: string | null;
  language: InvoiceLanguage;
}

/** Quantities are stored in thousandths: 1.5 hours is 1500. */
export const QUANTITY_SCALE = 1000;

/** VAT rates are basis points: 18% is 1800. */
export const BASIS_POINTS = 10_000;

/** Longest unit text ("hrs", "дена"). */
export const MAX_UNIT_LENGTH = 12;

const QUANTITY_SCALE_BIG = 1000n;
const BASIS_POINTS_BIG = 10_000n;

/** `numerator / denominator` rounded half-up (away from zero on .5), in integers. */
const divideHalfUp = (numerator: bigint, denominator: bigint): number => {
  const negative = numerator < 0n;
  const magnitude = negative ? -numerator : numerator;
  const rounded = (magnitude * 2n + denominator) / (denominator * 2n);

  return Number(negative ? -rounded : rounded);
};

export interface LineInput {
  quantityMilli: number;
  unitPriceMinor: number;
  vatRateBp: number;
}

export interface LineAmounts {
  amountMinor: number;
  vatMinor: number;
}

/** Line amount = quantity × unit price, rounded half-up to the minor unit; VAT on that, rounded. */
export const lineAmounts = (line: LineInput): LineAmounts => {
  const amountMinor = divideHalfUp(
    BigInt(line.quantityMilli) * BigInt(line.unitPriceMinor),
    QUANTITY_SCALE_BIG
  );

  return {
    amountMinor,
    vatMinor: divideHalfUp(
      BigInt(amountMinor) * BigInt(line.vatRateBp),
      BASIS_POINTS_BIG
    ),
  };
};

export interface VatGroup {
  rateBp: number;
  /** Sum of the line amounts taxed at this rate. */
  baseMinor: number;
  vatMinor: number;
}

export interface InvoiceTotals {
  subtotalMinor: number;
  /** One entry per rate in use, lowest rate first. */
  vatByRate: VatGroup[];
  vatMinor: number;
  totalMinor: number;
}

/** Sums already-rounded line amounts and VAT (per line, then summed), grouped per rate. */
export const invoiceTotals = (
  lines: readonly (LineAmounts & { vatRateBp: number })[]
): InvoiceTotals => {
  const groups = new Map<number, VatGroup>();
  let subtotalMinor = 0;
  let vatMinor = 0;

  for (const line of lines) {
    subtotalMinor += line.amountMinor;
    vatMinor += line.vatMinor;

    const group = groups.get(line.vatRateBp) ?? {
      baseMinor: 0,
      rateBp: line.vatRateBp,
      vatMinor: 0,
    };

    group.baseMinor += line.amountMinor;
    group.vatMinor += line.vatMinor;
    groups.set(line.vatRateBp, group);
  }

  const totalMinor = subtotalMinor + vatMinor;

  const vatByRate = [...groups.values()].toSorted(
    (a, b) => a.rateBp - b.rateBp
  );

  return { subtotalMinor, totalMinor, vatByRate, vatMinor };
};

const FILE_PREFIX: Record<InvoiceLanguage, string> = {
  en: "Invoice",
  mk: "Faktura",
};

const UNSAFE_FILE_CHARS = /[^\w.-]+/gu;

/** `Invoice-2026-012.pdf` / `Faktura-2026-012.pdf` (slashes and spaces become dashes). */
export const invoiceFileName = (
  number: string,
  language: InvoiceLanguage
): string =>
  `${FILE_PREFIX[language]}-${number.replaceAll(UNSAFE_FILE_CHARS, "-")}.pdf`;
