import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";
import { formFieldOfError } from "@/lib/server-errors";
import { useConfig } from "@/lib/session";

import { uploadFiles } from "../attachments/attachments.queries";
import { FileList, PendingFileList } from "../attachments/file-list";
import { financeSettingsQuery } from "../settings/finance-settings.queries";
import { InvoiceForm } from "./forms/invoice-form/invoice-form";
import {
  INVOICE_SERVER_FIELDS,
  invoiceFormToCreateRequest,
  invoiceFormToUpdateRequest,
  invoiceToFormValues,
} from "./forms/invoice-form/mapper";
import {
  newInvoiceDefaults,
  useClientOptions,
  useIssueGate,
} from "./invoice-dialog-data";
import { useInvoiceNumber } from "./invoice-labels";
import { InvoiceView } from "./invoice-view";
import { useCreateInvoice, useUpdateInvoice } from "./invoices.mutations";
import { invoiceQuery, nextInvoiceNumberQuery } from "./invoices.queries";
import type { InvoiceDetail } from "./invoices.queries";
import { useInvoiceActions } from "./use-invoice-actions";

type Close = () => Promise<void>;

const isFieldError = (error: Error) =>
  formFieldOfError(error, INVOICE_SERVER_FIELDS) !== null;

const NewInvoice = ({
  duplicateId,
  forClient,
  onClose,
}: {
  duplicateId: string | undefined;
  forClient: string | undefined;
  onClose: Close;
}) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const photos = useConfig().data?.photosEnabled === true;
  const [pending, setPending] = useState<File[]>([]);
  const clients = useClientOptions(null);
  const settings = useQuery(financeSettingsQuery);
  const next = useQuery(nextInvoiceNumberQuery(Number(todayIso().slice(0, 4))));
  const issueGate = useIssueGate();

  const source = useQuery({
    ...invoiceQuery(duplicateId ?? ""),
    enabled: duplicateId !== undefined,
  });

  const create = useCreateInvoice(isFieldError);

  const uploadPending = async (invoiceId: string) => {
    const failed = await uploadFiles(
      { ownerId: invoiceId, ownerType: "finance_invoice" },
      pending
    );

    for (const name of failed) {
      toast.error(t("invoices.files.uploadFailed", { name }));
    }
  };

  const sourcePending = duplicateId !== undefined && source.isPending;

  if (
    [
      clients.isPending,
      settings.isPending,
      next.isPending,
      sourcePending,
    ].includes(true)
  ) {
    return <FormSkeleton fields={6} />;
  }

  const terms = settings.data?.defaultPaymentTermsDays ?? 30;

  // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
  const defaults = newInvoiceDefaults({
    clients: clients.options,
    currency: format.currency,
    source: source.data?.invoice,
    terms,
    forClient,
  });

  return (
    <InvoiceForm
      clients={clients.options}
      projects={clients.projects}
      defaultTermsDays={terms}
      defaultValues={defaults}
      files={
        photos ? (
          <PendingFileList files={pending} onChange={setPending} />
        ) : undefined
      }
      onCancel={() => {
        void onClose();
      }}
      nextNumber={next.data?.number ?? null}
      onSubmit={async (values, issue) => {
        if (!(await issueGate(values, issue))) {
          return;
        }

        const { id } = await create.mutateAsync(
          invoiceFormToCreateRequest(values, issue)
        );

        await uploadPending(id);

        await onClose();
      }}
      previousNumber={next.data?.previous ?? null}
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

const EditInvoice = ({
  invoice,
  onClose,
}: {
  invoice: InvoiceDetail;
  onClose: Close;
}) => {
  const photos = useConfig().data?.photosEnabled === true;
  const clients = useClientOptions(invoice.clientId);
  const settings = useQuery(financeSettingsQuery);
  const update = useUpdateInvoice(isFieldError);
  const issueGate = useIssueGate();

  const next = useQuery(
    nextInvoiceNumberQuery(Number(invoice.issueDate.slice(0, 4)))
  );

  if (clients.isPending || settings.isPending) {
    return <FormSkeleton fields={6} />;
  }

  return (
    <InvoiceForm
      clients={clients.options}
      projects={clients.projects}
      defaultTermsDays={settings.data?.defaultPaymentTermsDays ?? 30}
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
      nextNumber={next.data?.number ?? null}
      onSubmit={async (values, issue) => {
        if (!(await issueGate(values, issue))) {
          return;
        }

        await update.mutateAsync({
          id: invoice.id,
          json: invoiceFormToUpdateRequest(values, issue),
        });
        await onClose();
      }}
      previousNumber={next.data?.previous ?? null}
    />
  );
};

/** Loads the invoice; drafts open the form, issued ones the locked view. */
const ExistingInvoice = ({
  invoiceId,
  onClose,
}: {
  invoiceId: string;
  onClose: Close;
}) => {
  const detail = useQuery(invoiceQuery(invoiceId));

  if (detail.isPending) {
    return <FormSkeleton fields={6} />;
  }

  if (detail.isError) {
    return (
      <ErrorState
        className="m-4 md:m-4"
        error={detail.error}
        onRetry={() => {
          void detail.refetch();
        }}
      />
    );
  }

  const { invoice } = detail.data;

  return invoice.status === "draft" ? (
    <EditInvoice invoice={invoice} onClose={onClose} />
  ) : (
    <InvoiceView invoice={invoice} onClose={onClose} />
  );
};

/** `?dialog=invoice` (+ `id` to edit/view, `duplicate`, `forClient`). */
export const InvoiceDialog = ({
  duplicateId,
  forClient,
  invoiceId,
  onClose,
  onOpenChange,
  open,
}: {
  duplicateId: string | undefined;
  forClient: string | undefined;
  invoiceId: string | undefined;
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => {
  const { t } = useTranslation("finances");

  const detail = useQuery({
    ...invoiceQuery(invoiceId ?? ""),
    enabled: invoiceId !== undefined,
  });

  const numberOf = useInvoiceNumber();
  let title = t("invoices.newTitle");

  if (invoiceId !== undefined) {
    title =
      detail.data === undefined
        ? t("invoices.editTitle")
        : numberOf(detail.data.invoice);
  }

  return (
    <FormDialog
      crumb={<span>{t("invoices.title")}</span>}
      onOpenChange={onOpenChange}
      open={open}
      size="lg"
      title={title}
    >
      {invoiceId === undefined ? (
        <NewInvoice
          duplicateId={duplicateId}
          forClient={forClient}
          onClose={onClose}
        />
      ) : (
        <ExistingInvoice invoiceId={invoiceId} onClose={onClose} />
      )}
    </FormDialog>
  );
};
