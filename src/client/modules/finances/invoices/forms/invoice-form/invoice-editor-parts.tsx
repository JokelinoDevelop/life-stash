import { Link } from "@tanstack/react-router";
import { Eye, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { FormNotice, FormSection } from "@/components/form/dialog-form";
import { withForm } from "@/components/form/form-hook";
import { Button } from "@/components/ui/button";

import {
  InvoiceNotesSection,
  InvoiceRecordedSection,
} from "./invoice-content-sections";
import {
  InvoiceClientSection,
  InvoiceDatesSection,
} from "./invoice-form-sections";
import { InvoiceLinesEditor } from "./invoice-lines-editor";
import { INVOICE_FORM_TEMPLATE } from "./mapper";
import type { InvoiceClientOption, InvoiceProjectOption } from "./mapper";
import type { InvoiceFormValues } from "./schema";

type Mode = InvoiceFormValues["mode"];

const itemised = (): Mode => "itemised";

const NO_CLIENTS: readonly InvoiceClientOption[] = [];
const NO_PROJECTS: readonly InvoiceProjectOption[] = [];
const NO_UNITS: readonly string[] = [];
const noNumber = (): string | null => null;
const noFiles = (): ReactNode => null;
const defaultTerms = (_clientId: string): number => 30;
const noUnits = (_clientId: string): readonly string[] => NO_UNITS;
const noSwitch = (_mode: Mode): void => undefined;

/** The editor's fields: client, dates, then lines (itemised) or amount + files (recorded). */
export const InvoiceEditorBody = withForm({
  defaultValues: INVOICE_FORM_TEMPLATE,
  props: {
    clients: NO_CLIENTS,
    defaultVatRateBp: 0,
    files: noFiles(),
    hasProfile: true,
    mode: itemised(),
    nextNumber: noNumber(),
    onSwitchMode: noSwitch,
    previousNumber: noNumber(),
    projects: NO_PROJECTS,
    termsOf: defaultTerms,
    unitsFor: noUnits,
    vatRegistered: false,
  },
  render: function InvoiceEditorBodyRender(props) {
    const { form, mode } = props;
    const { t } = useTranslation("finances");

    return (
      <>
        {mode === "itemised" && !props.hasProfile && (
          <FormNotice icon={<UserRound />}>
            {t("invoices.editor.noProfile")}{" "}
            <Link className="text-primary underline" to="/settings/finances">
              {t("invoices.editor.addDetails")}
            </Link>
          </FormNotice>
        )}
        <InvoiceClientSection
          clients={props.clients}
          form={form}
          nextNumber={props.nextNumber}
          previousNumber={props.previousNumber}
          projects={props.projects}
        />
        <InvoiceDatesSection form={form} termsOf={props.termsOf} />
        {mode === "itemised" ? (
          <form.Subscribe selector={(state) => state.values.clientId}>
            {(clientId) => (
              <InvoiceLinesEditor
                defaultVatRateBp={props.defaultVatRateBp}
                form={form}
                unitPicks={props.unitsFor(clientId)}
                vatRegistered={props.vatRegistered}
              />
            )}
          </form.Subscribe>
        ) : (
          <InvoiceRecordedSection form={form} />
        )}
        <InvoiceNotesSection form={form} />
        {mode === "recorded" && props.files !== null && (
          <FormSection
            description={t("invoices.files.hint")}
            title={t("invoices.files.title")}
          >
            {props.files}
          </FormSection>
        )}
        <FormSection>
          <Button
            className="self-start"
            onClick={() => {
              props.onSwitchMode(mode === "itemised" ? "recorded" : "itemised");
            }}
            size="compact"
            type="button"
            variant="link"
          >
            {mode === "itemised"
              ? t("invoices.editor.recordInstead")
              : t("invoices.editor.writeInstead")}
          </Button>
        </FormSection>
      </>
    );
  },
});

const noop = (): void => undefined;

const noPreview = async (): Promise<void> => {
  await Promise.resolve();
};

/** Save draft · Issue & download ⌘↵ (Save & issue when recorded); phones get Preview. */
export const InvoiceEditorFooter = withForm({
  defaultValues: INVOICE_FORM_TEMPLATE,
  props: {
    footerStart: noFiles(),
    mode: itemised(),
    onCancel: noop,
    onPreview: noPreview,
    onSaveDraft: noop,
  },
  render: function InvoiceEditorFooterRender({
    footerStart,
    form,
    mode,
    onCancel,
    onPreview,
    onSaveDraft,
  }) {
    const { t } = useTranslation("finances");

    return (
      <form.AppForm>
        <form.FormFooter
          onCancel={onCancel}
          secondary={
            <Button
              onClick={onSaveDraft}
              size="compact"
              type="button"
              variant="outline"
            >
              {t("invoices.form.saveDraft")}
            </Button>
          }
          start={
            <span className="flex items-center gap-1">
              {footerStart}
              {mode === "itemised" && (
                <Button
                  className="md:hidden"
                  onClick={() => {
                    void onPreview();
                  }}
                  size="compact"
                  type="button"
                  variant="ghost"
                >
                  <Eye />
                  {t("invoices.editor.preview")}
                </Button>
              )}
            </span>
          }
          submitLabel={
            mode === "itemised"
              ? t("invoices.editor.issueDownload")
              : t("invoices.form.saveIssue")
          }
        />
      </form.AppForm>
    );
  },
});
