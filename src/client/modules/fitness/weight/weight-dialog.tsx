import { addDays } from "@shared/domain/dates";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { useDeleteWeight, useUpsertWeight } from "../fitness.mutations";
import { weightQuery } from "../fitness.queries";
import type { WeightEntry } from "../fitness.queries";
import {
  weightFormDefaults,
  weightFormToRequest,
  weightToFormValues,
} from "./forms/weight-form/mapper";
import { WeightForm } from "./forms/weight-form/weight-form";

type Close = () => Promise<void>;

/** How far back the dialog looks for the last weight to prefill. */
export const PREFILL_DAYS = 60;

const DeleteButton = ({
  entry,
  onClose,
}: {
  entry: WeightEntry;
  onClose: Close;
}) => {
  const { t } = useTranslation("fitness");
  const { t: tc } = useTranslation();
  const format = useFormat();
  const confirm = useConfirm();
  const remove = useDeleteWeight();

  return (
    <Button
      aria-label={tc("actions.delete")}
      onClick={async () => {
        const ok = await confirm({
          confirmLabel: tc("actions.delete"),
          description: t("weight.deleteDescription", {
            date: format.date(entry.date),
          }),
          title: t("weight.deleteTitle"),
          tone: "destructive",
        });

        if (ok) {
          await remove.mutateAsync(entry.id);
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

const WeightBody = ({
  date,
  onClose,
}: {
  date: string | undefined;
  onClose: Close;
}) => {
  const day = date ?? todayIso();
  const recent = useQuery(weightQuery(addDays(day, -PREFILL_DAYS), day));
  const upsert = useUpsertWeight();

  if (recent.isPending) {
    return <FormSkeleton fields={3} />;
  }

  if (recent.isError) {
    return (
      <ErrorState
        className="m-4 md:m-4"
        error={recent.error}
        onRetry={() => {
          void recent.refetch();
        }}
      />
    );
  }

  const { entries } = recent.data;
  const existing = entries.find((entry) => entry.date === day);

  return (
    <WeightForm
      defaultValues={
        existing === undefined
          ? weightFormDefaults({
              date: day,
              lastGrams: entries.at(-1)?.weightGrams ?? null,
            })
          : weightToFormValues(existing)
      }
      footerStart={
        existing === undefined ? undefined : (
          <DeleteButton entry={existing} onClose={onClose} />
        )
      }
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        await upsert.mutateAsync(weightFormToRequest(values));
        await onClose();
      }}
    />
  );
};

/** Log body weight for a day (`?dialog=weight&date=…`); an existing day opens for editing. */
export const WeightDialog = ({
  date,
  onClose,
  onOpenChange,
  open,
}: {
  date: string | undefined;
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => {
  const { t } = useTranslation("fitness");

  return (
    <FormDialog
      crumb={<span>{t("title")}</span>}
      onOpenChange={onOpenChange}
      open={open}
      title={date === undefined ? t("weight.newTitle") : t("weight.editTitle")}
    >
      <WeightBody date={date} onClose={onClose} />
    </FormDialog>
  );
};
