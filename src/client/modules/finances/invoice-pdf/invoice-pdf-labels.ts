import type { InvoiceLanguage } from "@shared/domain/finances/invoice-document";
import type { i18n as I18n } from "i18next";

import type { InvoicePdfLabels } from "./invoice-pdf-data";

/** The printed words in the invoice's language (not the app's). */
export const invoicePdfLabels = (
  i18n: I18n,
  language: InvoiceLanguage
): InvoicePdfLabels => {
  const t = i18n.getFixedT(language, "finances", "pdf");

  return {
    accountOwner: t("accountOwner"),
    amount: t("amount"),
    bank: t("bank"),
    bankAddress: t("bankAddress"),
    billTo: t("billTo"),
    companyId: t("companyId"),
    country: t("country"),
    description: t("description"),
    draft: t("draft"),
    from: t("from"),
    due: t("due"),
    iban: t("iban"),
    invoice: t("invoice"),
    invoiceTotal: t("invoiceTotal"),
    issued: t("issued"),
    note: t("note"),
    number: t("number"),
    ownerAddress: t("ownerAddress"),
    payment: t("payment"),
    period: t("period"),
    purchaseOrder: t("purchaseOrder"),
    quantity: t("quantity"),
    referenceLabel: t("referenceLabel"),
    shipping: t("shipping"),
    subtotal: t("subtotal"),
    swift: t("swift"),
    tax: t("tax"),
    taxId: t("taxId"),
    taxRate: t("taxRate"),
    unitPrice: t("unitPrice"),
    vat: t("vat"),
    vatAt: (rate) => t("vatAt", { rate }),
  };
};

/** Quick picks for a line's unit, in the invoice's language: hrs · days · pcs. */
export const invoiceUnitPicks = (
  i18n: I18n,
  language: InvoiceLanguage
): string[] => {
  const t = i18n.getFixedT(language, "finances", "pdf.units");

  return [t("hours"), t("days"), t("pieces")];
};
