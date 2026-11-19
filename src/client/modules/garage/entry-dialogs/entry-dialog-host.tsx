import { useState } from "react";

import { CarDialog } from "../cars/car-dialog";
import { ExpenseDialog } from "../expenses/expense-dialog";
import { ReminderDialog } from "../reminders/reminder-dialog";
import { VisitDialog } from "../visits/visit-dialog";
import type { EntryDialogSearch } from "./entry-dialog-search";
import { useEntryDialog, useEntryDialogSearch } from "./use-entry-dialog";

/** Car-scoped dialogs need a car; a URL without one opens nothing. */
const isOpenable = (search: EntryDialogSearch): boolean =>
  search.dialog === "car" ||
  (search.dialog !== undefined && search.car !== undefined);

const dialogKey = (search: EntryDialogSearch): string =>
  `${search.dialog}:${search.car}:${search.id}:${search.reminder}`;

/**
 * Renders the create/edit dialog the URL asks for, over whatever page is
 * showing. It keeps the last dialog mounted while it closes, so the exit
 * animation plays after the URL has already dropped the keys.
 */
export const EntryDialogHost = () => {
  const search = useEntryDialogSearch();
  const { close } = useEntryDialog();
  const [shown, setShown] = useState<EntryDialogSearch | null>(null);
  const open = isOpenable(search);

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

  // The key remounts the form when another entry opens, so defaults reset.
  const key = dialogKey(current);
  const common = { onClose: close, onOpenChange, open };

  if (current.dialog === "car") {
    return <CarDialog carId={current.car} key={key} {...common} />;
  }

  const carId = current.car;

  if (carId === undefined) {
    return null;
  }

  if (current.dialog === "expense") {
    return (
      <ExpenseDialog
        carId={carId}
        expenseId={current.id}
        key={key}
        reminderId={current.reminder}
        {...common}
      />
    );
  }

  if (current.dialog === "service") {
    return (
      <VisitDialog
        carId={carId}
        key={key}
        reminderId={current.reminder}
        visitId={current.id}
        {...common}
      />
    );
  }

  if (current.dialog === "reminder") {
    return (
      <ReminderDialog
        carId={carId}
        key={key}
        reminderId={current.id}
        {...common}
      />
    );
  }

  return null;
};
