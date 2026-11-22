import type { InvoiceLanguage } from "@shared/domain/finances/invoice-document";
import type { StoredInvoiceStatus } from "@shared/domain/finances/invoices";
import type { Currency } from "@shared/domain/money";

import type { InvoiceDocumentData } from "../invoices.service";

/** Everything the invoice PDF is drawn from (frozen once issued). */
export interface GetInvoiceDocumentResponse {
  document: {
    id: string;
    /** Null while a draft (the preview shows "Draft"). */
    number: string | null;
    status: StoredInvoiceStatus;
    language: InvoiceLanguage;
    currency: Currency;
    issueDate: string;
    dueDate: string;
    periodStart: string | null;
    periodEnd: string | null;
    purchaseOrder: string | null;
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
      bankAddress: string | null;
      bankCountry: string | null;
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
      description: string;
      quantityMilli: number;
      unit: string | null;
      unitPriceMinor: number;
      vatRateBp: number;
      amountMinor: number;
      vatMinor: number;
    }[];
    totals: {
      subtotalMinor: number;
      vatByRate: { rateBp: number; baseMinor: number; vatMinor: number }[];
      vatMinor: number;
      shippingMinor: number;
      totalMinor: number;
    };
  };
}

export const toGetInvoiceDocumentResponse = ({
  client,
  invoice,
  issuer,
  language,
  lines,
  totals,
}: InvoiceDocumentData): GetInvoiceDocumentResponse => ({
  // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
  document: {
    client: {
      address: client.address,
      email: client.email,
      name: client.name,
      taxId: client.taxId,
    },
    currency: invoice.currency,
    dueDate: invoice.dueDate,
    id: invoice.id,
    issueDate: invoice.issueDate,
    issuer:
      issuer === null
        ? null
        : {
            address: issuer.address,
            bankAddress: issuer.bankAddress ?? null,
            bankCountry: issuer.bankCountry ?? null,
            bankName: issuer.bankName,
            companyId: issuer.companyId,
            email: issuer.email,
            footerNote: issuer.footerNote,
            iban: issuer.iban,
            name: issuer.name,
            phone: issuer.phone,
            swift: issuer.swift,
            taxId: issuer.taxId,
            vatRegistered: issuer.vatRegistered,
          },
    language,
    lines: lines.map((line) => ({
      amountMinor: line.amountMinor,
      description: line.description,
      quantityMilli: line.quantityMilli,
      unit: line.unit,
      unitPriceMinor: line.unitPriceMinor,
      vatMinor: line.vatMinor,
      vatRateBp: line.vatRateBp,
    })),
    note: invoice.description,
    number: invoice.number,
    periodEnd: invoice.periodEnd,
    periodStart: invoice.periodStart,
    purchaseOrder: invoice.purchaseOrder,
    status: invoice.status,
    totals: {
      shippingMinor: totals.shippingMinor,
      subtotalMinor: totals.subtotalMinor,
      totalMinor: totals.totalMinor,
      vatByRate: totals.vatByRate.map((group) => ({
        baseMinor: group.baseMinor,
        rateBp: group.rateBp,
        vatMinor: group.vatMinor,
      })),
      vatMinor: totals.vatMinor,
    },
  },
});
