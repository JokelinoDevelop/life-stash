import { useSelector } from "@tanstack/react-form";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { DialogForm } from "@/components/form/dialog-form";

import type { BusinessProfile } from "../../../business-profile/business-profile.queries";
import { invoiceUnitPicks } from "../../../invoice-pdf/invoice-pdf-labels";
import {
  RendererUnavailableError,
  openPendingTab,
  useInvoicePdfRenderer,
} from "../../../invoice-pdf/use-invoice-pdf";
import { nextInvoiceNumberQuery } from "../../invoices.queries";
import { InvoiceEditorBody, InvoiceEditorFooter } from "./invoice-editor-parts";
import { InvoicePreview, usePreviewFits } from "./invoice-preview";
import { newInvoiceLine } from "./mapper";
import type { InvoiceClientOption, InvoiceProjectOption } from "./mapper";
import { previewPdfData } from "./preview-data";
import type { InvoiceFormValues } from "./schema";
import { useInvoiceForm } from "./use-invoice-form";

export type InvoiceMode = InvoiceFormValues["mode"];

export interface InvoiceFormProps {
  defaultValues: InvoiceFormValues;
  clients: readonly InvoiceClientOption[];
  /** Projects of every client; the form offers the chosen client's active ones. */
  projects: readonly InvoiceProjectOption[];
  defaultTermsDays: number;
  /** Your details (null until filled in); itemised invoices print them. */
  profile: BusinessProfile | null;
  /** The Files section of a recorded invoice (saved list, or files waiting to upload). */
  files?: ReactNode;
  footerStart?: ReactNode;
  onCancel: () => void;
  /** Throws the API error on failure; field errors land on their input. */
  onSubmit: (values: InvoiceFormValues, issue: boolean) => Promise<void>;
  /** The dialog widens for the preview while itemised. */
  onModeChange?: (mode: InvoiceMode) => void;
}

const YEAR = /^\d{4}/u;

/** The year of a `YYYY-MM-DD` issue date (this year while it isn't one yet). */
const issueYearOf = (issueDate: string): number =>
  Number(YEAR.exec(issueDate)?.[0] ?? new Date().getFullYear());

/** The preview's data, kept stable until the content changes (see `InvoicePreview`). */
const PreviewPane = ({
  clients,
  nextNumber,
  profile,
  values,
}: {
  clients: readonly InvoiceClientOption[];
  nextNumber: string | null;
  profile: BusinessProfile | null;
  values: InvoiceFormValues;
}) => {
  const { i18n } = useTranslation();
  const client = clients.find((row) => row.id === values.clientId);
  const fallback = i18n.language === "mk" ? "mk" : "en";

  const data = useMemo(
    () =>
      previewPdfData(values, {
        client,
        fallbackLanguage: fallback,
        issuer: profile,
        number: nextNumber,
      }),
    [values, client, fallback, profile, nextNumber]
  );

  return <InvoicePreview data={data} />;
};

/**
 * New / edit draft invoice (3.3). Itemised: client, dates, lines and a live A4 preview;
 * Save draft or Issue & download (⌘↵). "Record an invoice made elsewhere" switches to the
 * amount + files flow.
 */
export const InvoiceForm = ({
  clients,
  defaultTermsDays,
  defaultValues,
  files,
  footerStart,
  onCancel,
  onModeChange,
  onSubmit,
  profile,
  projects,
}: InvoiceFormProps) => {
  const { i18n, t } = useTranslation("finances");
  const render = useInvoicePdfRenderer();
  // Drawn only when it fits, so phones don't render a PDF on every keystroke.
  const previewFits = usePreviewFits();
  const vatRegistered = profile?.vatRegistered === true;
  const defaultVatRateBp = vatRegistered ? (profile?.defaultVatRateBp ?? 0) : 0;

  const termsOf = (clientId: string) =>
    clients.find((client) => client.id === clientId)?.paymentTermsDays ??
    defaultTermsDays;

  const { form, submit } = useInvoiceForm(defaultValues, onSubmit);

  // The suggested number follows the issue date as it's edited (numbers count per year).
  const issueYear = issueYearOf(
    useSelector(form.store, (state) => state.values.issueDate)
  );

  const next = useQuery({
    ...nextInvoiceNumberQuery(issueYear),
    placeholderData: keepPreviousData,
  });

  const nextNumber = next.data?.number ?? null;
  const previousNumber = next.data?.previous ?? null;

  const switchMode = (mode: InvoiceMode) => {
    form.setFieldValue("mode", mode);

    if (mode === "itemised" && form.getFieldValue("lines").length === 0) {
      form.setFieldValue("lines", [newInvoiceLine(defaultVatRateBp)]);
    }

    onModeChange?.(mode);
  };

  const preview = async () => {
    const tab = openPendingTab();
    const { values } = form.state;

    try {
      tab.showBlob(
        await render(
          previewPdfData(values, {
            client: clients.find((row) => row.id === values.clientId),
            fallbackLanguage: i18n.language === "mk" ? "mk" : "en",
            issuer: profile,
            number: nextNumber,
          })
        )
      );
    } catch (error) {
      tab.close();
      console.error("Invoice preview failed", error);

      if (!(error instanceof RendererUnavailableError)) {
        toast.error(t("invoices.editor.previewFailed"));
      }
    }
  };

  const languageOf = (clientId: string) =>
    clients.find((row) => row.id === clientId)?.invoiceLanguage ??
    (i18n.language === "mk" ? "mk" : "en");

  return (
    <form.Subscribe selector={(state) => state.values.mode}>
      {(mode) => (
        <DialogForm
          aside={
            mode === "itemised" && previewFits ? (
              <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                  <PreviewPane
                    clients={clients}
                    nextNumber={nextNumber}
                    profile={profile}
                    values={values}
                  />
                )}
              </form.Subscribe>
            ) : undefined
          }
          footer={
            <InvoiceEditorFooter
              footerStart={footerStart}
              form={form}
              mode={mode}
              onCancel={onCancel}
              onPreview={preview}
              onSaveDraft={() => {
                submit(false);
              }}
            />
          }
          onSubmit={() => {
            submit(true);
          }}
        >
          <InvoiceEditorBody
            clients={clients}
            defaultVatRateBp={defaultVatRateBp}
            files={files ?? null}
            form={form}
            hasProfile={profile !== null}
            mode={mode}
            nextNumber={nextNumber}
            onSwitchMode={switchMode}
            previousNumber={previousNumber}
            projects={projects}
            termsOf={termsOf}
            unitsFor={(clientId) =>
              invoiceUnitPicks(i18n, languageOf(clientId))
            }
            vatRegistered={vatRegistered}
          />
        </DialogForm>
      )}
    </form.Subscribe>
  );
};
