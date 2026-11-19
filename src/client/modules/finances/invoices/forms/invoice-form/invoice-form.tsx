import { useRef } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/lib/errors";
import { formFieldOfError } from "@/lib/server-errors";

import {
  InvoiceAmountSection,
  InvoiceClientSection,
  InvoiceDatesSection,
} from "./invoice-form-sections";
import { INVOICE_SERVER_FIELDS } from "./mapper";
import type { InvoiceClientOption, InvoiceProjectOption } from "./mapper";
import { invoiceFormSchema } from "./schema";
import type { InvoiceFormValues } from "./schema";

export interface InvoiceFormProps {
  defaultValues: InvoiceFormValues;
  clients: readonly InvoiceClientOption[];
  /** Projects of every client; the form offers the chosen client's active ones. */
  projects: readonly InvoiceProjectOption[];
  /** The number this one continues from, for the hint. */
  previousNumber: string | null;
  /** Draft (or new): two saves, draft and "& mark sent". Sent: one Save. */
  draftable: boolean;
  defaultTermsDays: number;
  /** The Files section (saved list, or files waiting to upload). */
  files?: ReactNode;
  footerStart?: ReactNode;
  onCancel: () => void;
  /** Throws the API error on failure; field errors land on their input. */
  onSubmit: (values: InvoiceFormValues, markSent: boolean) => Promise<void>;
}

/** New / edit invoice (3.3): client, number, period, dates, amount, files, notes. */
export const InvoiceForm = ({
  clients,
  defaultTermsDays,
  defaultValues,
  draftable,
  files,
  footerStart,
  onCancel,
  onSubmit,
  previousNumber,
  projects,
}: InvoiceFormProps) => {
  const { t } = useTranslation("finances");
  const errorMessage = useErrorMessage();
  const markSent = useRef(true);

  const termsOf = (clientId: string) =>
    clients.find((client) => client.id === clientId)?.paymentTermsDays ??
    defaultTermsDays;

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value, markSent.current);
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

  const submit = (sent: boolean) => {
    markSent.current = sent;
    void form.handleSubmit();
  };

  return (
    <DialogForm
      footer={
        <form.AppForm>
          <form.FormFooter
            onCancel={onCancel}
            secondary={
              draftable ? (
                <Button
                  onClick={() => {
                    submit(false);
                  }}
                  size="compact"
                  type="button"
                  variant="outline"
                >
                  {t("invoices.form.saveDraft")}
                </Button>
              ) : undefined
            }
            start={footerStart}
            submitLabel={draftable ? t("invoices.form.saveSent") : undefined}
          />
        </form.AppForm>
      }
      onSubmit={() => {
        submit(draftable);
      }}
    >
      <InvoiceClientSection
        clients={clients}
        form={form}
        previousNumber={previousNumber}
        projects={projects}
      />
      <InvoiceDatesSection form={form} termsOf={termsOf} />
      <InvoiceAmountSection form={form} />
      {files !== undefined && (
        <FormSection
          description={t("invoices.files.hint")}
          title={t("invoices.files.title")}
        >
          {files}
        </FormSection>
      )}
    </DialogForm>
  );
};
