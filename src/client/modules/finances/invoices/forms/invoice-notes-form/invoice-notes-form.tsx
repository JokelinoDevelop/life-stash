import { useTranslation } from "react-i18next";

import { useAppForm } from "@/components/form/form-hook";

import { useUpdateInvoice } from "../../invoices.mutations";
import { invoiceNotesFormToRequest, invoiceNotesToFormValues } from "./mapper";
import { invoiceNotesFormSchema } from "./schema";

/** Notes on an issued invoice: the one thing that stays editable (Save shows once changed). */
export const InvoiceNotesForm = ({
  invoice,
}: {
  invoice: { id: string; notes: string | null };
}) => {
  const { t } = useTranslation("finances");
  const update = useUpdateInvoice();

  const form = useAppForm({
    defaultValues: invoiceNotesToFormValues(invoice),
    onSubmit: async ({ value, formApi }) => {
      await update.mutateAsync({
        id: invoice.id,
        json: invoiceNotesFormToRequest(value),
      });
      formApi.reset(value);
    },
    validators: { onSubmit: invoiceNotesFormSchema },
  });

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="notes">
        {(field) => (
          <field.TextareaField
            label={t("invoices.form.notes")}
            optional
            placeholder={t("invoices.form.notesPlaceholder")}
          />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.isDirty}>
        {(dirty) =>
          dirty && (
            <form.AppForm>
              <form.SubmitButton
                className="self-end"
                label={t("invoices.view.saveNotes")}
              />
            </form.AppForm>
          )
        }
      </form.Subscribe>
    </form>
  );
};
