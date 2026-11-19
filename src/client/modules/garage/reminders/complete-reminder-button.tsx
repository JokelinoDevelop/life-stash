import { EXPENSE_REMINDER_KINDS } from "@shared/domain/garage-kinds";
import type { ReminderKind } from "@shared/domain/garage-kinds";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

/**
 * "Done" opens a prefilled entry: a service visit for service reminders, an expense for
 * insurance/registration. Saving that entry completes the reminder and schedules the next.
 */
export const CompleteReminderButton = ({
  carId,
  reminder,
}: {
  carId: string;
  reminder: { id: string; kind: ReminderKind };
}) => {
  const { t } = useTranslation();

  const label = (
    <>
      <Check />
      {t("actions.done")}
    </>
  );

  if (EXPENSE_REMINDER_KINDS.includes(reminder.kind)) {
    return (
      <Button asChild size="compact" variant="outline">
        <Link
          params={{ carId }}
          search={{ reminderId: reminder.id }}
          to="/garage/cars/$carId/expenses/new"
        >
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild size="compact" variant="outline">
      <Link
        params={{ carId }}
        search={{ reminderId: reminder.id }}
        to="/garage/cars/$carId/services/new"
      >
        {label}
      </Link>
    </Button>
  );
};
