import {
  Check,
  CheckCheck,
  MoreHorizontal,
  Pencil,
  SkipForward,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { ListRow, ListRowText } from "@/components/app/list-section";
import { StatusRing } from "@/components/app/status-ring";
import { STATUS_TEXT_TONE } from "@/components/app/status-tone";
import type { SwipeAction } from "@/components/app/swipe-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useInvalidateGarage } from "../cars/cars.queries";
import { describeDue } from "../cars/describe-due";
import { EntryDialogLink } from "../entry-dialogs/entry-dialog-link";
import { useEntryDialog } from "../entry-dialogs/use-entry-dialog";
import { CompleteReminderButton } from "./complete-reminder-button";
import { completionEntry } from "./completion-entry";
import type { ActiveReminder } from "./reminders.queries";
import { SkipReminderDialog } from "./skip-reminder-dialog";

const useIntervalText = (reminder: ActiveReminder): string | null => {
  const { t } = useTranslation("garageReminders");
  const format = useFormat();

  const parts = [
    reminder.intervalMonths === null
      ? null
      : t("tab.months", { count: reminder.intervalMonths }),
    reminder.intervalKm === null ? null : format.distance(reminder.intervalKm),
  ].filter((part) => part !== null);

  return parts.length === 0
    ? null
    : t("tab.every", { interval: parts.join(" / ") });
};

const ReminderMenu = ({
  carId,
  onSkip,
  reminder,
}: {
  carId: string;
  onSkip: () => void;
  reminder: ActiveReminder;
}) => {
  const { t } = useTranslation("garageReminders");
  const { t: tc } = useTranslation();
  const invalidate = useInvalidateGarage();
  const errorMessage = useErrorMessage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={tc("actions.edit")}
            size="icon-compact"
            variant="ghost"
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          render={
            <EntryDialogLink
              entry={{ car: carId, dialog: "reminder", id: reminder.id }}
            />
          }
        >
          <Pencil />
          {tc("actions.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSkip}>
          <CheckCheck />
          {t("tab.skip")}
        </DropdownMenuItem>
        <ConfirmDialog
          onConfirm={async () => {
            try {
              await unwrap(
                api.garage.reminders[":reminderId"].$delete({
                  param: { reminderId: reminder.id },
                })
              );
              await invalidate();
              toast.success(t("tab.deleted"));
            } catch (error) {
              toast.error(errorMessage(error));
            }
          }}
          trigger={
            <DropdownMenuItem closeOnClick={false} variant="destructive">
              <Trash2 />
              {tc("actions.delete")}
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Phone swipe actions for a reminder row — Skip (asks when, like the menu) and
 * Done (opens the entry that completes it) — plus the Skip dialog to render.
 */
interface ReminderSwipe {
  actions: SwipeAction[];
  dialog: ReactNode;
  handleSkip: () => void;
}

export const useReminderSwipe = (
  carId: string,
  reminder: { id: string; kind: ActiveReminder["kind"] }
): ReminderSwipe => {
  const { t } = useTranslation("garageReminders");
  const { t: tc } = useTranslation();
  const entryDialog = useEntryDialog();
  const [skipping, setSkipping] = useState(false);

  const handleSkip = () => {
    setSkipping(true);
  };

  return {
    actions: [
      {
        icon: <SkipForward />,
        label: t("tab.skipShort"),
        onSelect: handleSkip,
        tone: "neutral",
      },
      {
        icon: <Check />,
        label: tc("actions.done"),
        onSelect: () => {
          void entryDialog.open(completionEntry(carId, reminder));
        },
        tone: "success",
      },
    ],
    dialog: (
      <SkipReminderDialog
        onOpenChange={setSkipping}
        open={skipping}
        reminderId={reminder.id}
      />
    ),
    handleSkip,
  };
};

export const ReminderRow = ({
  carId,
  reminder,
  readOnly,
}: {
  carId: string;
  reminder: ActiveReminder;
  readOnly: boolean;
}) => {
  const { t } = useTranslation("garageReminders");
  const { t: tc } = useTranslation();
  const format = useFormat();
  const interval = useIntervalText(reminder);
  const swipe = useReminderSwipe(carId, reminder);
  const due = describeDue(reminder, format, tc);

  const extra = [t(`kinds.${reminder.kind}`), interval].filter(
    (part): part is string => part !== null && part !== ""
  );

  return (
    <ListRow
      className="gap-2.5 py-2 md:gap-3 md:py-1"
      after={swipe.dialog}
      swipe={readOnly ? undefined : swipe.actions}
    >
      <StatusRing status={reminder.status} />
      <ListRowText
        meta={
          <>
            {due !== "" && (
              <span
                className={cn(
                  "tabular-nums",
                  STATUS_TEXT_TONE[reminder.status]
                )}
              >
                {due}
              </span>
            )}
            {extra.length > 0 && ` · ${extra.join(" · ")}`}
          </>
        }
        title={reminder.title}
      />
      {!readOnly && (
        <CompleteReminderButton carId={carId} reminder={reminder} />
      )}
      {!readOnly && (
        <ReminderMenu
          carId={carId}
          onSkip={swipe.handleSkip}
          reminder={reminder}
        />
      )}
    </ListRow>
  );
};
