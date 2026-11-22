import { useRef } from "react";

import { useAppForm } from "@/components/form/form-hook";
import { useErrorMessage } from "@/lib/errors";
import { formFieldOfError } from "@/lib/server-errors";

import { INVOICE_SERVER_FIELDS } from "./mapper";
import { invoiceFormSchema } from "./schema";
import type { InvoiceFormValues } from "./schema";

/**
 * The invoice editor's form. `submit(true)` issues, `submit(false)` saves a draft; a server
 * error about a field (e.g. a taken number) lands on that field.
 */
export const useInvoiceForm = (
  defaultValues: InvoiceFormValues,
  onSubmit: (values: InvoiceFormValues, issue: boolean) => Promise<void>
) => {
  const errorMessage = useErrorMessage();
  const issue = useRef(true);

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value, issue.current);
      } catch (error) {
        const field =
          error instanceof Error
            ? formFieldOfError(error, INVOICE_SERVER_FIELDS)
            : null;

        if (field !== null) {
          form.setFieldMeta(field, (meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onSubmit: errorMessage(error) },
            isTouched: true,
          }));
        }
      }
    },
    validators: { onSubmit: invoiceFormSchema },
  });

  const submit = (issueNow: boolean) => {
    issue.current = issueNow;
    void form.handleSubmit();
  };

  return { form, submit };
};
