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
    amount: t("amount"),
    amountDue: t("amountDue"),
    bank: t("bank"),
    billTo: t("billTo"),
    companyId: t("companyId"),
    description: t("description"),
    draft: t("draft"),
    due: t("due"),
    iban: t("iban"),
    invoice: t("invoice"),
    issued: t("issued"),
    number: t("number"),
    payment: t("payment"),
    period: t("period"),
    quantity: t("quantity"),
    reference: (number) => t("reference", { number }),
    subtotal: t("subtotal"),
    swift: t("swift"),
    taxId: t("taxId"),
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
