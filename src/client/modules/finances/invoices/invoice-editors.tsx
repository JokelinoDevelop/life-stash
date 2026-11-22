import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { FormSkeleton } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";
import { formFieldOfError } from "@/lib/server-errors";
import { useConfig } from "@/lib/session";

import { uploadFiles } from "../attachments/attachments.queries";
import { FileList, PendingFileList } from "../attachments/file-list";
import { InvoiceForm } from "./forms/invoice-form/invoice-form";
import type { InvoiceMode } from "./forms/invoice-form/invoice-form";
import {
  INVOICE_SERVER_FIELDS,
  invoiceFormToCreateRequest,
  invoiceFormToUpdateRequest,
  invoiceToFormValues,
} from "./forms/invoice-form/mapper";
import type { InvoiceFormValues } from "./forms/invoice-form/schema";
import {
  newInvoiceDefaults,
  useEditorContext,
  useIssueGate,
} from "./invoice-dialog-data";
import { useStoreInvoicePdf } from "./invoice-document";
import { useCreateInvoice, useUpdateInvoice } from "./invoices.mutations";
import { invoiceQuery } from "./invoices.queries";
import type { InvoiceDetail } from "./invoices.queries";
import { useInvoiceActions } from "./use-invoice-actions";

type Close = () => Promise<void>;

const isFieldError = (error: Error) =>
  formFieldOfError(error, INVOICE_SERVER_FIELDS) !== null;

/** Defaults for a new invoice once its context (and the invoice it duplicates) has loaded. */
const useNewInvoiceDefaults = (
  context: ReturnType<typeof useEditorContext>,
  duplicateId: string | undefined,
  forClient: string | undefined
): InvoiceFormValues | null => {
  const format = useFormat();

  const source = useQuery({
    ...invoiceQuery(duplicateId ?? ""),
    enabled: duplicateId !== undefined,
  });

  if (context.isPending || (duplicateId !== undefined && source.isPending)) {
    return null;
  }

  // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
  return newInvoiceDefaults({
    clients: context.clients,
    currency: format.currency,
    defaultVatRateBp: context.profile?.defaultVatRateBp ?? 0,
    forClient,
    source: source.data?.invoice,
    terms: context.terms,
  });
};

/**
 * After saving: an itemised invoice that was just issued gets its PDF drawn, stored and
 * downloaded ("Issue & download").
 */
const useAfterSave = () => {
  const storePdf = useStoreInvoicePdf();

  return async (
    values: InvoiceFormValues,
    saved: { id: string; number: string | null }
  ) => {
    if (values.mode === "itemised" && saved.number !== null) {
      await storePdf(
        { id: saved.id, number: saved.number },
        { download: true }
      );
    }
  };
};

export const NewInvoice = ({
  duplicateId,
  forClient,
  onClose,
  onModeChange,
}: {
  duplicateId: string | undefined;
  forClient: string | undefined;
  onClose: Close;
  onModeChange: (mode: InvoiceMode) => void;
}) => {
  const { t } = useTranslation("finances");
  const photos = useConfig().data?.photosEnabled === true;
  const [pending, setPending] = useState<File[]>([]);
  const context = useEditorContext(null);
  const issueGate = useIssueGate();
  const afterSave = useAfterSave();
  const create = useCreateInvoice(isFieldError);
  const defaults = useNewInvoiceDefaults(context, duplicateId, forClient);

  if (defaults === null) {
    return <FormSkeleton fields={6} />;
  }

  const uploadPending = async (invoiceId: string) => {
    const failed = await uploadFiles(
      { ownerId: invoiceId, ownerType: "finance_invoice" },
      pending
    );

    for (const name of failed) {
      toast.error(t("invoices.files.uploadFailed", { name }));
    }
  };

  return (
    <InvoiceForm
      clients={context.clients}
      defaultTermsDays={context.terms}
      defaultValues={defaults}
      files={
        photos ? (
          <PendingFileList files={pending} onChange={setPending} />
        ) : undefined
      }
      onCancel={() => {
        void onClose();
      }}
      onModeChange={onModeChange}
      onSubmit={async (values, issue) => {
        if (!(await issueGate(values, issue))) {
          return;
        }

        const saved = await create.mutateAsync(
          invoiceFormToCreateRequest(values, issue)
        );

        if (values.mode === "recorded") {
          await uploadPending(saved.id);
        }

        await afterSave(values, saved);
        await onClose();
      }}
      profile={context.profile}
      projects={context.projects}
    />
  );
};

const DeleteButton = ({
  invoice,
  onClose,
}: {
  invoice: InvoiceDetail;
  onClose: Close;
}) => {
  const { t: tc } = useTranslation();
  const actions = useInvoiceActions();

  return (
    <Button
      aria-label={tc("actions.delete")}
      onClick={async () => {
        if (await actions.remove(invoice)) {
          await onClose();
        }
      }}
      size="icon-compact"
      type="button"
      variant="ghost"
    >
      <Trash2 />
    </Button>
  );
};

export const EditDraft = ({
  invoice,
  onClose,
  onModeChange,
}: {
  invoice: InvoiceDetail;
  onClose: Close;
  onModeChange: (mode: InvoiceMode) => void;
}) => {
  const photos = useConfig().data?.photosEnabled === true;
  const context = useEditorContext(invoice.clientId);
  const update = useUpdateInvoice(isFieldError);
  const issueGate = useIssueGate();
  const afterSave = useAfterSave();

  if (context.isPending) {
    return <FormSkeleton fields={6} />;
  }

  return (
    <InvoiceForm
      clients={context.clients}
      defaultTermsDays={context.terms}
      defaultValues={invoiceToFormValues(invoice)}
      files={
        photos ? (
          <FileList
            owner={{ ownerId: invoice.id, ownerType: "finance_invoice" }}
          />
        ) : undefined
      }
      footerStart={<DeleteButton invoice={invoice} onClose={onClose} />}
      onCancel={() => {
        void onClose();
      }}
      onModeChange={onModeChange}
      onSubmit={async (values, issue) => {
        if (!(await issueGate(values, issue))) {
          return;
        }

        const saved = await update.mutateAsync({
          id: invoice.id,
          json: invoiceFormToUpdateRequest(values, issue),
        });

        await afterSave(values, saved);
        await onClose();
      }}
      profile={context.profile}
      projects={context.projects}
    />
  );
};
