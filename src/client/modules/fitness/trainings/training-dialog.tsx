import { useQuery } from "@tanstack/react-query";
import { Archive, ArchiveRestore } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";
import { Button } from "@/components/ui/button";

import {
  useArchiveTraining,
  useCreateTraining,
  useUpdateTraining,
} from "../fitness.mutations";
import { trainingsQuery } from "../fitness.queries";
import type { Training } from "../fitness.queries";
import {
  trainingFormDefaults,
  trainingFormToCreateRequest,
  trainingFormToUpdateRequest,
  trainingToFormValues,
} from "./forms/training-form/mapper";
import { TrainingForm } from "./forms/training-form/training-form";

type Close = () => Promise<void>;

/** Archive (asks first: it ends the weekly repeat) or restore, in the dialog footer. */
const ArchiveButton = ({
  onClose,
  training,
}: {
  onClose: Close;
  training: Training;
}) => {
  const { t } = useTranslation("fitness");
  const confirm = useConfirm();
  const archive = useArchiveTraining();

  return (
    <Button
      onClick={async () => {
        if (!training.archived) {
          const ok = await confirm({
            confirmLabel: t("trainings.archive"),
            description: t("trainings.archiveDescription", {
              name: training.name,
            }),
            title: t("trainings.archiveTitle"),
          });

          if (!ok) {
            return;
          }
        }

        await archive.mutateAsync({
          archived: !training.archived,
          id: training.id,
        });
        await onClose();
      }}
      size="compact"
      type="button"
      variant="ghost"
    >
      {training.archived ? <ArchiveRestore /> : <Archive />}
      {training.archived ? t("trainings.restore") : t("trainings.archive")}
    </Button>
  );
};

const TrainingBody = ({
  onClose,
  trainingId,
}: {
  onClose: Close;
  trainingId: string | undefined;
}) => {
  const trainings = useQuery({
    ...trainingsQuery(true),
    enabled: trainingId !== undefined,
  });

  const create = useCreateTraining();
  const update = useUpdateTraining();

  const cancel = () => {
    void onClose();
  };

  if (trainingId === undefined) {
    return (
      <TrainingForm
        defaultValues={trainingFormDefaults()}
        onCancel={cancel}
        onSubmit={async (values) => {
          await create.mutateAsync(trainingFormToCreateRequest(values));
          await onClose();
        }}
      />
    );
  }

  if (trainings.isPending) {
    return <FormSkeleton fields={4} />;
  }

  const training = trainings.data?.trainings.find(
    (row) => row.id === trainingId
  );

  if (trainings.isError || training === undefined) {
    return (
      <ErrorState
        className="m-4 md:m-4"
        error={trainings.error}
        onRetry={() => {
          void trainings.refetch();
        }}
      />
    );
  }

  return (
    <TrainingForm
      defaultValues={trainingToFormValues(training)}
      footerStart={<ArchiveButton onClose={onClose} training={training} />}
      onCancel={cancel}
      onSubmit={async (values) => {
        await update.mutateAsync({
          id: training.id,
          json: trainingFormToUpdateRequest(values),
        });
        await onClose();
      }}
    />
  );
};

/** New training or edit one (`?dialog=training&id=…`). */
export const TrainingDialog = ({
  onClose,
  onOpenChange,
  open,
  trainingId,
}: {
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  trainingId: string | undefined;
}) => {
  const { t } = useTranslation("fitness");

  return (
    <FormDialog
      crumb={<span>{t("title")}</span>}
      onOpenChange={onOpenChange}
      open={open}
      title={
        trainingId === undefined
          ? t("trainings.newTitle")
          : t("trainings.editTitle")
      }
    >
      <TrainingBody onClose={onClose} trainingId={trainingId} />
    </FormDialog>
  );
};
