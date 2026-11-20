import { MAX_UNIT_LENGTH } from "@shared/domain/finances/invoice-document";
import { CURRENCIES } from "@shared/domain/money";
import { z } from "zod";

import { isoDateField, optionalText, parseAmount } from "@/lib/form-schemas";

const REQUIRED = "validation.required";
const NUMBER = "validation.number";
const AMOUNT = /^\d+(?:[.,]\d{1,2})?$/u;
const QUANTITY = /^\d+(?:[.,]\d{1,3})?$/u;
const PERCENT = /^\d{1,3}(?:[.,]\d{1,2})?$/u;
const MAX_PERCENT = 100;
const MAX_QUANTITY = 100_000;

const compact = (value: string) => value.replaceAll(/\s/gu, "");

const decimal = (value: string) => Number(compact(value).replace(",", "."));

/** One line as typed. Checked only for itemised invoices (see the refinement below). */
const invoiceLineFields = z.object({
  description: z.string(),
  /** Stable React key; not sent. */
  key: z.string(),
  quantity: z.string(),
  unit: z.string(),
  unitPrice: z.string(),
  /** Percent, e.g. "18"; ignored when you're not VAT registered. */
  vatRate: z.string(),
});

export type InvoiceFormLine = z.infer<typeof invoiceLineFields>;

interface Issue {
  path: (string | number)[];
  message: string;
}

/** What's wrong with one line, as issues on its fields. */
const lineIssues = (line: InvoiceFormLine, index: number): Issue[] => {
  const at = (field: keyof InvoiceFormLine, message: string): Issue => ({
    message,
    path: ["lines", index, field],
  });

  const issues: Issue[] = [];

  if (line.description.trim() === "") {
    issues.push(at("description", REQUIRED));
  }

  if (
    !QUANTITY.test(compact(line.quantity)) ||
    decimal(line.quantity) <= 0 ||
    decimal(line.quantity) > MAX_QUANTITY
  ) {
    issues.push(at("quantity", NUMBER));
  }

  if (!AMOUNT.test(compact(line.unitPrice))) {
    issues.push(at("unitPrice", NUMBER));
  }

  if (line.unit.trim().length > MAX_UNIT_LENGTH) {
    issues.push(at("unit", "validation.tooLong"));
  }

  const rate = compact(line.vatRate);

  if (rate !== "" && (!PERCENT.test(rate) || decimal(rate) > MAX_PERCENT)) {
    issues.push(at("vatRate", NUMBER));
  }

  return issues;
};

export const invoiceFormSchema = z
  .object({
    /** Recorded invoices only: the total as typed. */
    amount: z.string().trim(),
    clientId: z.string().min(1, REQUIRED),
    currency: z.enum(CURRENCIES),
    /** Recorded: what it was for. Itemised: a note printed under the lines. */
    description: optionalText(300),
    dueDate: isoDateField,
    issueDate: isoDateField,
    lines: z.array(invoiceLineFields),
    /** `itemised`: written here with lines and a PDF. `recorded`: made elsewhere. */
    mode: z.enum(["itemised", "recorded"]),
    notes: optionalText(2000),
    /** Empty takes the next number when issuing; drafts have none. */
    number: optionalText(40),
    /** `YYYY-MM` of the billed month, or "none". */
    period: z.string(),
    /** A project of the chosen client, or "none". */
    projectId: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.mode === "recorded") {
      if ((parseAmount(values.amount) ?? 0) <= 0) {
        ctx.addIssue({ code: "custom", message: REQUIRED, path: ["amount"] });
      }

      return;
    }

    if (values.lines.length === 0) {
      ctx.addIssue({ code: "custom", message: REQUIRED, path: ["lines"] });
    }

    for (const [index, line] of values.lines.entries()) {
      for (const issue of lineIssues(line, index)) {
        ctx.addIssue({ code: "custom", ...issue });
      }
    }
  });

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
