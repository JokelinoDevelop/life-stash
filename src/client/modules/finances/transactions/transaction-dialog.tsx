import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";
import { formFieldOfError } from "@/lib/server-errors";
import { useConfig } from "@/lib/session";

import { uploadFiles } from "../attachments/attachments.queries";
import { FileList } from "../attachments/file-list";
import { ReceiptChip } from "../attachments/receipt-chip";
import { categoriesQuery } from "../categories/categories.queries";
import type { FinanceCategory } from "../categories/categories.queries";
import { clientsQuery } from "../clients/clients.queries";
import {
  TRANSACTION_SERVER_FIELDS,
  duplicateToFormValues,
  transactionFormDefaults,
  transactionFormToCreateRequest,
  transactionFormToUpdateRequest,
  transactionToFormValues,
} from "./forms/transaction-form/mapper";
import type { TransactionFormValues } from "./forms/transaction-form/schema";
import { TransactionForm } from "./forms/transaction-form/transaction-form";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
} from "./transactions.mutations";
import { transactionQuery } from "./transactions.queries";

type Close = () => Promise<void>;

/** Active clients for the income client chip (plus the entry's own, if archived). */
const useClientOptions = (keep: string | null) => {
  const clients = useQuery(clientsQuery(Number(todayIso().slice(0, 4))));

  return (clients.data?.clients ?? []).filter(
    (client) => !client.archived || client.id === keep
  );
};

const isFieldError = (error: Error) =>
  formFieldOfError(error, TRANSACTION_SERVER_FIELDS) !== null;

const CreateForm = ({
  categories,
  defaultValues,
  onClose,
}: {
  categories: readonly FinanceCategory[];
  defaultValues: TransactionFormValues;
  onClose: Close;
}) => {
  const create = useCreateTransaction(isFieldError);
  const clients = useClientOptions(null);
  const photos = useConfig().data?.photosEnabled === true;
  const [receipts, setReceipts] = useState<File[]>([]);
  const { t } = useTranslation("finances");

  return (
    <TransactionForm
      categories={categories}
      clients={clients}
      defaultValues={defaultValues}
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        const { id } = await create.mutateAsync(
          transactionFormToCreateRequest(values)
        );

        if (receipts.length > 0) {
          const failed = await uploadFiles(
            { ownerId: id, ownerType: "finance_transaction" },
            receipts
          );

          for (const name of failed) {
            toast.error(t("invoices.files.uploadFailed", { name }));
          }
        }

        await onClose();
      }}
      receipt={
        photos ? (
          <ReceiptChip files={receipts} onChange={setReceipts} />
        ) : undefined
      }
    />
  );
};

const LoadFailed = ({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) => <ErrorState className="m-4 md:m-4" error={error} onRetry={onRetry} />;

/** A new transaction, optionally copied from another one ("Duplicate"). */
const NewTransaction = ({
  duplicateId,
  forClient,
  kind: initialKind,
  onClose,
}: {
  duplicateId: string | undefined;
  forClient: string | undefined;
  kind: "income" | "expense";
  onClose: Close;
}) => {
  const format = useFormat();
  const categories = useQuery(categoriesQuery);

  const source = useQuery({
    ...transactionQuery(duplicateId ?? ""),
    enabled: duplicateId !== undefined,
  });

  if (categories.isPending || (duplicateId !== undefined && source.isPending)) {
    return <FormSkeleton />;
  }

  if (categories.isError) {
    return (
      <LoadFailed
        error={categories.error}
        onRetry={() => {
          void categories.refetch();
        }}
      />
    );
  }

  const defaults =
    source.data === undefined
      ? transactionFormDefaults({
          clientId: forClient,
          currency: format.currency,
          kind: initialKind,
          today: todayIso(),
        })
      : duplicateToFormValues(source.data.transaction, todayIso());

  return (
    <CreateForm
      categories={categories.data.categories}
      defaultValues={defaults}
      onClose={onClose}
    />
  );
};

const DeleteButton = ({
  description,
  onClose,
  transactionId,
}: {
  description: string;
  onClose: Close;
  transactionId: string;
}) => {
  const { t } = useTranslation("finances");
  const { t: tc } = useTranslation();
  const confirm = useConfirm();
  const remove = useDeleteTransaction();

  return (
    <Button
      aria-label={tc("actions.delete")}
      onClick={async () => {
        const ok = await confirm({
          description: t("transactions.deleteDescription", { description }),
          title: t("transactions.deleteTitle"),
          tone: "destructive",
        });

        if (ok) {
          await remove.mutateAsync(transactionId);
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

const EditTransaction = ({
  onClose,
  transactionId,
}: {
  onClose: Close;
  transactionId: string;
}) => {
  const categories = useQuery(categoriesQuery);
  const detail = useQuery(transactionQuery(transactionId));
  const update = useUpdateTransaction(isFieldError);
  const clients = useClientOptions(detail.data?.transaction.clientId ?? null);
  const photos = useConfig().data?.photosEnabled === true;

  if (categories.isPending || detail.isPending) {
    return <FormSkeleton />;
  }

  if (detail.isError || categories.isError) {
    return (
      <LoadFailed
        error={detail.error ?? categories.error}
        onRetry={() => {
          void detail.refetch();
          void categories.refetch();
        }}
      />
    );
  }

  const { transaction } = detail.data;

  return (
    <TransactionForm
      categories={categories.data.categories}
      clients={clients}
      defaultValues={transactionToFormValues(transaction)}
      receipt={
        photos ? (
          <FileList
            compact
            owner={{ ownerId: transactionId, ownerType: "finance_transaction" }}
          />
        ) : undefined
      }
      footerStart={
        <DeleteButton
          description={transaction.description}
          onClose={onClose}
          transactionId={transactionId}
        />
      }
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        await update.mutateAsync({
          id: transactionId,
          json: transactionFormToUpdateRequest(values),
        });
        await onClose();
      }}
    />
  );
};

/** Log an expense or income, duplicate one, or edit one (`?dialog=transaction`). */
export const TransactionDialog = ({
  duplicateId,
  forClient,
  kind,
  onClose,
  onOpenChange,
  open,
  transactionId,
}: {
  duplicateId: string | undefined;
  forClient: string | undefined;
  kind: "income" | "expense" | undefined;
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  transactionId: string | undefined;
}) => {
  const { t } = useTranslation("finances");

  return (
    <FormDialog
      crumb={<span>{t("title")}</span>}
      onOpenChange={onOpenChange}
      open={open}
      title={
        transactionId === undefined
          ? t("transactions.log")
          : t("transactions.editTitle")
      }
    >
      {transactionId === undefined ? (
        <NewTransaction
          duplicateId={duplicateId}
          forClient={forClient}
          kind={kind ?? "expense"}
          onClose={onClose}
        />
      ) : (
        <EditTransaction onClose={onClose} transactionId={transactionId} />
      )}
    </FormDialog>
  );
};
