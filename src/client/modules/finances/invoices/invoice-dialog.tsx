import type { Currency } from "@shared/domain/money";
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
import { clientsQuery } from "../clients/clients.queries";
import { useLedgerMoney } from "../money";
import { projectsQuery } from "../projects/projects.queries";
import { financeSettingsQuery } from "../settings/finance-settings.queries";
import { InvoiceForm } from "./forms/invoice-form/invoice-form";
import {
  INVOICE_SERVER_FIELDS,
  duplicateToFormValues,
  invoiceFormDefaults,
  invoiceFormToCreateRequest,
  invoiceFormToUpdateRequest,
  invoiceToFormValues,
} from "./forms/invoice-form/mapper";
import type { InvoiceClientOption } from "./forms/invoice-form/mapper";
import { InvoiceView } from "./invoice-view";
import { useCreateInvoice, useUpdateInvoice } from "./invoices.mutations";
import { invoiceQuery, nextInvoiceNumberQuery } from "./invoices.queries";
import type { InvoiceDetail } from "./invoices.queries";
import { useInvoiceActions } from "./use-invoice-actions";

type Close = () => Promise<void>;

const isFieldError = (error: Error) =>
  formFieldOfError(error, INVOICE_SERVER_FIELDS) !== null;

/** Clients that can be invoiced (active ones, plus the invoice's own if archived). */
const useClientOptions = (keep: string | null) => {
  const year = Number(todayIso().slice(0, 4));
  const clients = useQuery(clientsQuery(year));

  const options: InvoiceClientOption[] = (clients.data?.clients ?? []).filter(
    (client) => !client.archived || client.id === keep
  );

  const projects = useQuery(projectsQuery(null));

  // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
  return {
    isPending: clients.isPending || projects.isPending,
    options,
    projects: projects.data?.projects ?? [],
  };
};

/** A fresh invoice (for `forClient` if given), or a copy of `source` one month on. */
const newInvoiceDefaults = (context: {
  clients: readonly InvoiceClientOption[];
  currency: Currency;
  forClient: string | undefined;
  number: string;
  source: InvoiceDetail | undefined;
  terms: number;
}) =>
  context.source === undefined
    ? invoiceFormDefaults({
        client: context.clients.find(
          (client) => client.id === context.forClient
        ),
        currency: context.currency,
        number: context.number,
        termsDays: context.terms,
        today: todayIso(),
      })
    : duplicateToFormValues(context.source, context.number);

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
  const next = useQuery(nextInvoiceNumberQuery);

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

  const number = next.data?.number ?? "";
  const terms = settings.data?.defaultPaymentTermsDays ?? 30;

  // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
  const defaults = newInvoiceDefaults({
    clients: clients.options,
    currency: format.currency,
    number,
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
      draftable
      files={
        photos ? (
          <PendingFileList files={pending} onChange={setPending} />
        ) : undefined
      }
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values, markSent) => {
        const { id } = await create.mutateAsync(
          invoiceFormToCreateRequest(values, markSent)
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
  const ledger = useLedgerMoney();
  const actions = useInvoiceActions();

  return (
    <Button
      aria-label={tc("actions.delete")}
      onClick={async () => {
        if (
          await actions.remove(
            invoice,
            ledger.money(invoice.amountMinor, invoice.currency)
          )
        ) {
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

  if (clients.isPending || settings.isPending) {
    return <FormSkeleton fields={6} />;
  }

  return (
    <InvoiceForm
      clients={clients.options}
      projects={clients.projects}
      defaultTermsDays={settings.data?.defaultPaymentTermsDays ?? 30}
      defaultValues={invoiceToFormValues(invoice)}
      draftable={invoice.status === "draft"}
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
      onSubmit={async (values, markSent) => {
        await update.mutateAsync({
          id: invoice.id,
          json: invoiceFormToUpdateRequest(
            values,
            markSent && invoice.status === "draft"
          ),
          number: values.number,
        });
        await onClose();
      }}
      previousNumber={null}
    />
  );
};

/** Loads the invoice; paid ones open the locked view, others the form. */
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

  return invoice.status === "paid" ? (
    <InvoiceView invoice={invoice} onClose={onClose} />
  ) : (
    <EditInvoice invoice={invoice} onClose={onClose} />
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

  const number = detail.data?.invoice.number;
  let title = t("invoices.newTitle");

  if (invoiceId !== undefined) {
    title = number ?? t("invoices.editTitle");
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
