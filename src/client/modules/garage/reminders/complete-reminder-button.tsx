import { EXPENSE_REMINDER_KINDS } from "@shared/domain/garage-kinds";
import type { ReminderKind } from "@shared/domain/garage-kinds";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { EntryDialogLink } from "../entry-dialogs/entry-dialog-link";

type Variant = "button" | "circle" | "hover";

const CompletionLink = ({
  carId,
  children,
  className,
  label,
  reminder,
}: {
  carId: string;
  children: ReactNode;
  className?: string;
  label?: string;
  reminder: { id: string; kind: ReminderKind };
}) => (
  <EntryDialogLink
    aria-label={label}
    className={className}
    entry={{
      car: carId,
      dialog: EXPENSE_REMINDER_KINDS.includes(reminder.kind)
        ? "expense"
        : "service",
      reminder: reminder.id,
    }}
  >
    {children}
  </EntryDialogLink>
);

/**
 * "Done" opens a prefilled entry: a service visit for service reminders, an expense for
 * insurance/registration. Saving that entry completes the reminder and schedules the next.
 * `circle` is the phone check circle; `hover` shows "Mark done" on desktop row hover.
 */
export const CompleteReminderButton = ({
  carId,
  reminder,
  variant = "button",
}: {
  carId: string;
  reminder: { id: string; kind: ReminderKind; title: string };
  variant?: Variant;
}) => {
  const { t } = useTranslation();

  if (variant === "circle") {
    return (
      <CompletionLink
        carId={carId}
        className="group/done flex size-11 shrink-0 items-center justify-center"
        label={t("actions.markDoneOf", { title: reminder.title })}
        reminder={reminder}
      >
        <span className="text-muted-foreground/0 group-hover/done:text-muted-foreground border-muted-foreground/40 flex size-6 items-center justify-center rounded-full border-2 transition-colors">
          <Check className="size-3.5" />
        </span>
      </CompletionLink>
    );
  }

  const content =
    variant === "hover" ? (
      t("actions.markDone")
    ) : (
      <>
        <Check />
        {t("actions.done")}
      </>
    );

  const button = (
    <Button
      asChild
      size={variant === "hover" ? "xs" : "compact"}
      variant="outline"
    >
      <CompletionLink carId={carId} reminder={reminder}>
        {content}
      </CompletionLink>
    </Button>
  );

  return variant === "hover" ? (
    <span className="opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
      {button}
    </span>
  ) : (
    button
  );
};
