import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, Dumbbell, Plus, Scale } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Item } from "@/components/app/command-menu-parts";
import { CommandGroup } from "@/components/ui/command";
import { FITNESS_SHORTCUTS } from "@/lib/shortcuts";

import { useFitnessDialog } from "./dialogs/use-fitness-dialog";

/** Closes the menu, then starts the given navigation. */
type Run = (start: () => Promise<void>) => void;

/** ⌘K actions for Fitness. */
export const FitnessActionsGroup = ({ run }: { run: Run }) => {
  const { t } = useTranslation("fitness");
  const { t: tc } = useTranslation("command");
  const dialog = useFitnessDialog();

  return (
    <CommandGroup heading={`${t("title")} · ${tc("groups.actions")}`}>
      <Item
        icon={Plus}
        label={t("command.addSession")}
        onSelect={() => {
          run(async () => {
            await dialog.open({ dialog: "session" });
          });
        }}
        shortcut={FITNESS_SHORTCUTS.addSession}
      />
      <Item
        icon={Scale}
        label={t("command.logWeight")}
        onSelect={() => {
          run(async () => {
            await dialog.open({ dialog: "weight" });
          });
        }}
        shortcut={FITNESS_SHORTCUTS.logWeight}
      />
      <Item
        icon={Dumbbell}
        label={t("command.addTraining")}
        onSelect={() => {
          run(async () => {
            await dialog.open({ dialog: "training" });
          });
        }}
      />
    </CommandGroup>
  );
};

/** ⌘K: the Fitness pages. */
export const FitnessPagesGroup = ({ run }: { run: Run }) => {
  const { t } = useTranslation("fitness");
  const { t: tc } = useTranslation("command");
  const navigate = useNavigate();

  const go = (to: "/fitness" | "/fitness/trainings" | "/fitness/weight") => {
    run(async () => {
      await navigate({ to });
    });
  };

  return (
    <CommandGroup heading={`${t("title")} · ${tc("groups.goTo")}`}>
      <Item
        icon={CalendarDays}
        label={t("command.calendar")}
        onSelect={() => {
          go("/fitness");
        }}
      />
      <Item
        icon={Dumbbell}
        label={t("nav.trainings")}
        onSelect={() => {
          go("/fitness/trainings");
        }}
      />
      <Item
        icon={Scale}
        label={t("nav.weight")}
        onSelect={() => {
          go("/fitness/weight");
        }}
      />
    </CommandGroup>
  );
};
