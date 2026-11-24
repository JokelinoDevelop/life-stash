import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { todayIso } from "@/lib/partial-date";

import {
  useCreateSession,
  useDeleteSession,
  usePutOccurrence,
  useUpdateSession,
} from "../fitness.mutations";
import {
  occurrenceQuery,
  sessionQuery,
  trainingsQuery,
} from "../fitness.queries";
import type { SessionDetail, Training } from "../fitness.queries";
import {
  sessionFormDefaults,
  sessionFormToCreateRequest,
  sessionFormToOccurrenceRequest,
  sessionFormToUpdateRequest,
  sessionToFormValues,
} from "./forms/session-form/mapper";
import { SessionForm } from "./forms/session-form/session-form";

type Close = () => Promise<void>;

const DeleteButton = ({
  name,
  onClose,
  sessionId,
}: {
  name: string;
  onClose: Close;
  sessionId: string;
}) => {
  const { t } = useTranslation("fitness");
  const { t: tc } = useTranslation();
  const confirm = useConfirm();
  const remove = useDeleteSession();

  return (
    <Button
      aria-label={tc("actions.delete")}
      onClick={async () => {
        const ok = await confirm({
          confirmLabel: tc("actions.delete"),
          description: t("sessions.deleteDescription", { name }),
          title: t("sessions.deleteTitle"),
          tone: "destructive",
        });

        if (ok) {
          await remove.mutateAsync(sessionId);
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

/** Trainings a session can pick: active ones, plus the one it already uses. */
const trainingOptions = (
  trainings: readonly Training[],
  currentId: string | null
) =>
  trainings.filter(
    (training) => !training.archived || training.id === currentId
  );

/** Edit a stored session, or touch a weekly occurrence (its row is written on first save). */
const ExistingSession = ({
  detail,
  onClose,
  trainings,
}: {
  detail: SessionDetail;
  onClose: Close;
  trainings: readonly Training[];
}) => {
  const update = useUpdateSession();
  const putOccurrence = usePutOccurrence();
  const locked = detail.scheduleId !== null;
  const { id, originalDate, scheduleId } = detail;

  return (
    <SessionForm
      defaultValues={sessionToFormValues(detail)}
      footerStart={
        id !== null && !locked ? (
          <DeleteButton name={detail.name} onClose={onClose} sessionId={id} />
        ) : undefined
      }
      lockedTraining={locked ? detail.name : undefined}
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        if (id !== null) {
          await update.mutateAsync({
            id,
            json: sessionFormToUpdateRequest(values, locked),
          });
        } else if (scheduleId !== null && originalDate !== null) {
          await putOccurrence.mutateAsync(
            sessionFormToOccurrenceRequest(values, { originalDate, scheduleId })
          );
        }

        await onClose();
      }}
      trainings={trainingOptions(trainings, detail.trainingId)}
    />
  );
};

const NewSession = ({
  date,
  onClose,
  trainings,
}: {
  date: string | undefined;
  onClose: Close;
  trainings: readonly Training[];
}) => {
  const create = useCreateSession();
  const today = todayIso();
  const active = trainingOptions(trainings, null);

  return (
    <SessionForm
      defaultValues={sessionFormDefaults({
        today,
        date: date ?? today,
        trainingId: active[0]?.id ?? "",
      })}
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        await create.mutateAsync(sessionFormToCreateRequest(values));
        await onClose();
      }}
      trainings={active}
    />
  );
};

/** The stored session or weekly occurrence the dialog edits; null for a new session. */
const useSessionDetail = (
  sessionId: string | undefined,
  scheduleId: string | undefined,
  date: string | undefined
) => {
  const stored = useQuery({
    ...sessionQuery(sessionId ?? ""),
    enabled: sessionId !== undefined,
  });

  const occurrence = useQuery({
    ...occurrenceQuery(scheduleId ?? "", date ?? ""),
    enabled:
      sessionId === undefined && scheduleId !== undefined && date !== undefined,
  });

  if (sessionId !== undefined) {
    return stored;
  }

  return scheduleId === undefined ? null : occurrence;
};

const SessionBody = ({
  date,
  onClose,
  scheduleId,
  sessionId,
}: {
  date: string | undefined;
  onClose: Close;
  scheduleId: string | undefined;
  sessionId: string | undefined;
}) => {
  const trainings = useQuery(trainingsQuery(true));
  const detail = useSessionDetail(sessionId, scheduleId, date);
  const pending = trainings.isPending || detail?.isPending === true;

  if (pending) {
    return <FormSkeleton fields={5} />;
  }

  if (trainings.isError || detail?.isError === true) {
    return (
      <ErrorState
        className="m-4 md:m-4"
        error={trainings.error ?? detail?.error}
        onRetry={() => {
          void trainings.refetch();
          void detail?.refetch();
        }}
      />
    );
  }

  if (detail?.data !== undefined) {
    return (
      <ExistingSession
        detail={detail.data}
        onClose={onClose}
        trainings={trainings.data.trainings}
      />
    );
  }

  return (
    <NewSession
      date={date}
      onClose={onClose}
      trainings={trainings.data.trainings}
    />
  );
};

/**
 * A session over any page: `?dialog=session&id=…` (stored), `&schedule=…&date=…` (a weekly
 * occurrence) or `&date=…` / nothing (new: plan a one-off or log an unplanned one).
 */
export const SessionDialog = ({
  date,
  onClose,
  onOpenChange,
  open,
  scheduleId,
  sessionId,
}: {
  date: string | undefined;
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  scheduleId: string | undefined;
  sessionId: string | undefined;
}) => {
  const { t } = useTranslation("fitness");
  const isNew = sessionId === undefined && scheduleId === undefined;

  return (
    <FormDialog
      crumb={<span>{t("title")}</span>}
      onOpenChange={onOpenChange}
      open={open}
      title={isNew ? t("sessions.newTitle") : t("sessions.editTitle")}
    >
      <SessionBody
        date={date}
        onClose={onClose}
        scheduleId={scheduleId}
        sessionId={sessionId}
      />
    </FormDialog>
  );
};
