import { useNavigate } from "@tanstack/react-router";

import { useHotkey } from "@/hooks/use-hotkey";
import { CAR_SHORTCUTS } from "@/lib/shortcuts";

/** L / S / E / R on a car page: log odometer, service, expense, reminder. */
export const useCarShortcuts = (carId: string, enabled: boolean): void => {
  const navigate = useNavigate();
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
    void navigate({
      params: { carId },
      to: "/garage/cars/$carId/services/new",
    });
  };

  const handleAddExpense = () => {
    void navigate({
      params: { carId },
      to: "/garage/cars/$carId/expenses/new",
    });
  };

  const handleAddReminder = () => {
    void navigate({
      params: { carId },
      to: "/garage/cars/$carId/reminders/new",
    });
  };

  useHotkey(CAR_SHORTCUTS.logOdometer, handleLogOdometer, options);
  useHotkey(CAR_SHORTCUTS.addService, handleAddService, options);
  useHotkey(CAR_SHORTCUTS.addExpense, handleAddExpense, options);
  useHotkey(CAR_SHORTCUTS.addReminder, handleAddReminder, options);
};
