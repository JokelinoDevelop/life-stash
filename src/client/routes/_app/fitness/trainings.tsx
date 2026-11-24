import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/hooks/use-hotkey";
import { FITNESS_SHORTCUTS } from "@/lib/shortcuts";
import { cached, warm } from "@/lib/warm";
import { useFitnessDialog } from "@/modules/fitness/dialogs/use-fitness-dialog";
import { trainingsQuery } from "@/modules/fitness/fitness.queries";
import { TrainingsView } from "@/modules/fitness/trainings/trainings-view";

const TrainingsPage = () => {
  const { t } = useTranslation("fitness");
  const dialog = useFitnessDialog();

  const addTraining = () => {
    void dialog.open({ dialog: "training" });
  };

  useHotkey(FITNESS_SHORTCUTS.addTraining, addTraining);

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button
              className="hidden md:inline-flex"
              onClick={addTraining}
              size="compact"
            >
              <Plus />
              {t("trainings.add")}
              <Kbd>{FITNESS_SHORTCUTS.addTraining.toUpperCase()}</Kbd>
            </Button>
            <Button
              aria-label={t("trainings.add")}
              className="md:hidden"
              onClick={addTraining}
              size="icon-compact"
              variant="ghost"
            >
              <Plus />
            </Button>
          </>
        }
        back={<BackLink label={t("title")} to="/fitness" />}
        title={t("nav.trainings")}
      />
      <TrainingsView />
    </>
  );
};

export const Route = createFileRoute("/_app/fitness/trainings")({
  loader: async ({ context: { queryClient } }) => {
    await warm(queryClient.query(cached(trainingsQuery(true))));
  },
  component: TrainingsPage,
});
