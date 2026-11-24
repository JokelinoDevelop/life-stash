import { useState } from "react";

import { SessionDialog } from "../sessions/session-dialog";
import { TrainingDialog } from "../trainings/training-dialog";
import { WeightDialog } from "../weight/weight-dialog";
import { isFitnessDialog } from "./fitness-dialog-search";
import type { FitnessDialogSearch } from "./fitness-dialog-search";
import { useFitnessDialog, useFitnessDialogSearch } from "./use-fitness-dialog";

const dialogKey = (search: FitnessDialogSearch): string =>
  `${search.dialog}:${search.id}:${search.schedule}:${search.date}`;

/**
 * Renders the Fitness dialog the URL asks for over any page, and keeps the last one
 * mounted while it animates out (same approach as the Finances host).
 */
export const FitnessDialogHost = () => {
  const search = useFitnessDialogSearch();
  const { close } = useFitnessDialog();
  const [shown, setShown] = useState<FitnessDialogSearch | null>(null);
  const open = isFitnessDialog(search.dialog);

  // Derived state: remember the latest open dialog (set during render, no effect).
  if (open && (shown === null || dialogKey(search) !== dialogKey(shown))) {
    setShown(search);
  }

  const current = open ? search : shown;

  if (current === null) {
    return null;
  }

  const onOpenChange = (next: boolean) => {
    if (!next) {
      void close();
    }
  };

  const key = dialogKey(current);
  const common = { onClose: close, onOpenChange, open };

  if (current.dialog === "training") {
    return <TrainingDialog key={key} trainingId={current.id} {...common} />;
  }

  if (current.dialog === "session") {
    return (
      <SessionDialog
        date={current.date}
        key={key}
        scheduleId={current.schedule}
        sessionId={current.id}
        {...common}
      />
    );
  }

  if (current.dialog === "weight") {
    return <WeightDialog date={current.date} key={key} {...common} />;
  }

  return null;
};
