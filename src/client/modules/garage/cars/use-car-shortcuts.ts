import { useNavigate } from "@tanstack/react-router";

import { useHotkey } from "@/hooks/use-hotkey";
import { CAR_SHORTCUTS } from "@/lib/shortcuts";

import { useEntryDialog } from "../entry-dialogs/use-entry-dialog";

/** L / S / E / R on a car page: log odometer, service, expense, reminder. */
export const useCarShortcuts = (carId: string, enabled: boolean): void => {
  const navigate = useNavigate();
  const entryDialog = useEntryDialog();
  const options = { enabled };

  const handleLogOdometer = () => {
    void navigate({
      params: { carId },
      replace: true,
      search: { log: true, tab: "mileage" },
      to: "/garage/cars/$carId",
    });
  };

  const handleAddService = () => {
    void entryDialog.open({ car: carId, dialog: "service" });
  };

  const handleAddExpense = () => {
    void entryDialog.open({ car: carId, dialog: "expense" });
  };

  const handleAddReminder = () => {
    void entryDialog.open({ car: carId, dialog: "reminder" });
  };

  useHotkey(CAR_SHORTCUTS.logOdometer, handleLogOdometer, options);
  useHotkey(CAR_SHORTCUTS.addService, handleAddService, options);
  useHotkey(CAR_SHORTCUTS.addExpense, handleAddExpense, options);
  useHotkey(CAR_SHORTCUTS.addReminder, handleAddReminder, options);
};
