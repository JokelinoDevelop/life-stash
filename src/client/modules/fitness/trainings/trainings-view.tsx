import { useQuery } from "@tanstack/react-query";
import { Dumbbell } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  ListRow,
  ListRowText,
  ListSection,
} from "@/components/app/list-section";
import { PageStack } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";

import { FitnessDialogLink } from "../dialogs/fitness-dialog-link";
import { trainingsQuery } from "../fitness.queries";
import type { Training } from "../fitness.queries";
import { useWeekdayNames } from "../use-weekday-names";

const TrainingRow = ({ training }: { training: Training }) => {
  const { t } = useTranslation("fitness");
  const weekdays = useWeekdayNames();

  const facts = [
    training.weekdays.length === 0
      ? t("trainings.noRepeat")
      : weekdays.list(training.weekdays),
    training.durationMinutes === null
      ? null
      : t("minutes", { count: training.durationMinutes }),
  ].filter((fact) => fact !== null);

  return (
    <ListRow
      render={
        <FitnessDialogLink entry={{ dialog: "training", id: training.id }} />
      }
    >
      <span className="bg-muted text-subtle-foreground flex size-7 shrink-0 items-center justify-center rounded-md [&_svg]:size-4">
        <Dumbbell />
      </span>
      <ListRowText meta={facts.join(" · ")} title={training.name} />
    </ListRow>
  );
};

/** Your trainings (active, then archived) — tap one to edit, archive or restore it. */
export const TrainingsView = () => {
  const { t } = useTranslation("fitness");
  const trainings = useQuery(trainingsQuery(true));

  if (trainings.isPending) {
    return <LoadingState />;
  }

  if (trainings.isError) {
    return (
      <ErrorState
        error={trainings.error}
        onRetry={() => {
          void trainings.refetch();
        }}
      />
    );
  }

  const active = trainings.data.trainings.filter((row) => !row.archived);
  const archived = trainings.data.trainings.filter((row) => row.archived);

  if (active.length === 0 && archived.length === 0) {
    return (
      <EmptyState
        action={
          <Button
            nativeButton={false}
            render={<FitnessDialogLink entry={{ dialog: "training" }} />}
            size="compact"
          >
            {t("trainings.add")}
          </Button>
        }
        icon={<Dumbbell />}
        message={t("trainings.emptyMessage")}
        title={t("trainings.emptyTitle")}
      />
    );
  }

  return (
    <PageStack>
      {active.length > 0 && (
        <ListSection count={active.length} title={t("trainings.active")}>
          {active.map((training) => (
            <TrainingRow key={training.id} training={training} />
          ))}
        </ListSection>
      )}
      {archived.length > 0 && (
        <ListSection count={archived.length} title={t("trainings.archived")}>
          {archived.map((training) => (
            <TrainingRow key={training.id} training={training} />
          ))}
        </ListSection>
      )}
    </PageStack>
  );
};
