import type { InvoicePdfData } from "../../../invoice-pdf/invoice-pdf-data";
import { formLineTotals, parseShipping, periodBounds } from "./mapper";
import type { InvoiceClientOption } from "./mapper";
import type { InvoiceFormValues } from "./schema";

type Issuer = NonNullable<InvoicePdfData["issuer"]>;

const clientBlock = (
  client: InvoiceClientOption | undefined
): InvoicePdfData["client"] =>
  client === undefined
    ? { address: null, email: null, name: "—", taxId: null }
    : {
        address: client.address,
        email: client.email,
        name: client.name,
        taxId: client.taxId,
      };

const emptyToNull = (value: string): string | null => {
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
};

/**
 * What the live preview draws from the form as typed: your current details, the chosen
 * client, the lines priced like the server will, and the number it will get.
 */
export const previewPdfData = (
  values: InvoiceFormValues,
  context: {
    issuer: Issuer | null;
    client: InvoiceClientOption | undefined;
    number: string | null;
    fallbackLanguage: InvoicePdfData["language"];
  }
): InvoicePdfData => {
  const priced = formLineTotals(
    values.lines,
    context.issuer?.vatRegistered === true,
    parseShipping(values.shipping)
  );

  const bounds = periodBounds(values.period);

  return {
    client: clientBlock(context.client),
    currency: values.currency,
    dueDate: values.dueDate,
    issueDate: values.issueDate,
    issuer: context.issuer,
    language: context.client?.invoiceLanguage ?? context.fallbackLanguage,
    lines: priced.lines.map((line) => ({
      amountMinor: line.amountMinor,
      description: line.description,
      key: line.key,
      quantityMilli: line.quantityMilli,
      unit: line.unit,
      unitPriceMinor: line.unitPriceMinor,
      vatMinor: line.vatMinor,
      vatRateBp: line.vatRateBp,
    })),
    note: emptyToNull(values.description),
    number: emptyToNull(values.number) ?? context.number,
    periodEnd: bounds?.end ?? null,
    periodStart: bounds?.start ?? null,
    purchaseOrder: emptyToNull(values.purchaseOrder),
    totals: priced.totals,
  };
};
