import type {
  InvoiceLanguage,
  InvoiceTotals,
} from "@shared/domain/finances/invoice-document";
import type { Currency } from "@shared/domain/money";

/** Everything the invoice PDF draws. Built from the API document or, for the preview, a draft. */
export interface InvoicePdfData {
  language: InvoiceLanguage;
  /** Null for a draft: the PDF says "Draft" instead. */
  number: string | null;
  currency: Currency;
  issueDate: string;
  dueDate: string;
  periodStart: string | null;
  periodEnd: string | null;
  /** Printed under the lines. */
  note: string | null;
  issuer: {
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
  } | null;
  client: {
    name: string;
    address: string | null;
    taxId: string | null;
    email: string | null;
  };
  lines: {
    /** Stable React key (the line id, or its place in a draft). */
    key: string;
    description: string;
    quantityMilli: number;
    unit: string | null;
    unitPriceMinor: number;
    vatRateBp: number;
    amountMinor: number;
    vatMinor: number;
  }[];
  totals: InvoiceTotals;
}

/** The words printed on the invoice, in the invoice's language. */
export interface InvoicePdfLabels {
  invoice: string;
  draft: string;
  number: string;
  issued: string;
  due: string;
  period: string;
  billTo: string;
  description: string;
  quantity: string;
  unitPrice: string;
  vat: string;
  amount: string;
  subtotal: string;
  /** "VAT 18%" */
  vatAt: (rate: string) => string;
  amountDue: string;
  payment: string;
  reference: (number: string) => string;
  taxId: string;
  companyId: string;
  bank: string;
  iban: string;
  swift: string;
}
