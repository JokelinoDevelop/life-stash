import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import { Button } from "@/components/ui/button";

import { FitnessDialogLink } from "../dialogs/fitness-dialog-link";
import { useCreateSession } from "../fitness.mutations";
import { trainingsQuery } from "../fitness.queries";
import type { Training } from "../fitness.queries";

/**
 * One tap to put a training on the chosen day (after a confirmation): logged as done today
 * or earlier, planned ahead. "Other…" opens the full dialog for that day.
 */
export const QuickAdd = ({
  day,
  dayLabel,
  today,
}: {
  day: string;
  dayLabel: string;
  today: string;
}) => {
  const { t } = useTranslation("fitness");
  const confirm = useConfirm();
  const trainings = useQuery(trainingsQuery(false));
  const create = useCreateSession();
  const ahead = day > today;

  const add = async (training: Training) => {
    const ok = await confirm({
      confirmLabel: t("quickAdd.confirm"),
      description: ahead
        ? t("quickAdd.plannedDescription")
        : t("quickAdd.doneDescription"),
      title: t("quickAdd.title", { date: dayLabel, name: training.name }),
    });

    if (!ok) {
      return;
    }

    create.mutate({
      date: day,
      durationMinutes: ahead ? null : training.durationMinutes,
      note: null,
      status: ahead ? "planned" : "done",
      title: null,
      trainingId: training.id,
    });
  };

  return (
    <li className="flex flex-col gap-2 px-3.5 py-3 md:px-5">
      <span className="text-muted-foreground text-xs">
        {ahead ? t("quickAdd.planHint") : t("quickAdd.logHint")}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {(trainings.data?.trainings ?? []).map((training) => (
          <Button
            disabled={create.isPending}
            key={training.id}
            onClick={() => {
              void add(training);
            }}
            size="sm"
            variant="chip"
          >
            <Plus />
            {training.name}
          </Button>
        ))}
        <Button
          nativeButton={false}
          render={
            <FitnessDialogLink entry={{ date: day, dialog: "session" }} />
          }
          size="sm"
          variant="chip"
        >
          {t("quickAdd.other")}
        </Button>
      </div>
    </li>
  );
};
