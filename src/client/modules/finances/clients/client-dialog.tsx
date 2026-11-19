import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";
import { formFieldOfError } from "@/lib/server-errors";

import { financeSettingsQuery } from "../settings/finance-settings.queries";
import { useCreateClient, useUpdateClient } from "./clients.mutations";
import { clientQuery } from "./clients.queries";
import { ClientForm } from "./forms/client-form/client-form";
import {
  CLIENT_SERVER_FIELDS,
  clientFormDefaults,
  clientFormToCreateRequest,
  clientFormToUpdateRequest,
  clientToFormValues,
} from "./forms/client-form/mapper";

type Close = () => Promise<void>;

const isFieldError = (error: Error) =>
  formFieldOfError(error, CLIENT_SERVER_FIELDS) !== null;

const NewClient = ({ onClose }: { onClose: Close }) => {
  const format = useFormat();
  const settings = useQuery(financeSettingsQuery);
  const create = useCreateClient(isFieldError);

  if (settings.isPending) {
    return <FormSkeleton fields={5} />;
  }

  return (
    <ClientForm
      defaultValues={clientFormDefaults({
        currency: format.currency,
        termsDays: settings.data?.defaultPaymentTermsDays ?? 30,
      })}
      isNew
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        await create.mutateAsync(clientFormToCreateRequest(values));
        await onClose();
      }}
    />
  );
};

const EditClient = ({
  clientId,
  onClose,
}: {
  clientId: string;
  onClose: Close;
}) => {
  const year = Number(todayIso().slice(0, 4));
  const detail = useQuery(clientQuery(clientId, year));
  const update = useUpdateClient(isFieldError);

  if (detail.isPending) {
    return <FormSkeleton fields={5} />;
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

  return (
    <ClientForm
      defaultValues={clientToFormValues(detail.data.client)}
      isNew={false}
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        await update.mutateAsync({
          id: clientId,
          json: clientFormToUpdateRequest(values),
          name: values.name,
        });
        await onClose();
      }}
    />
  );
};

/** `?dialog=client` (+ `id` to edit). */
export const ClientDialog = ({
  clientId,
  onClose,
  onOpenChange,
  open,
}: {
  clientId: string | undefined;
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => {
  const { t } = useTranslation("finances");

  return (
    <FormDialog
      crumb={<span>{t("clients.title")}</span>}
      onOpenChange={onOpenChange}
      open={open}
      title={
        clientId === undefined ? t("clients.newTitle") : t("clients.editTitle")
      }
    >
      {clientId === undefined ? (
        <NewClient onClose={onClose} />
      ) : (
        <EditClient clientId={clientId} onClose={onClose} />
      )}
    </FormDialog>
  );
};
