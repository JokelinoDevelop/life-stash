import { CheckCheck, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { ListRow, ListRowText } from "@/components/app/list-section";
import { ResponsiveDialog } from "@/components/app/responsive-dialog";
import { StatusRing } from "@/components/app/status-ring";
import { STATUS_TEXT_TONE } from "@/components/app/status-tone";
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
import { todayIso } from "@/lib/partial-date";
import { cn } from "@/lib/utils";

import { useInvalidateGarage } from "../cars/cars.queries";
import { describeDue } from "../cars/describe-due";
import { EntryDialogLink } from "../entry-dialogs/entry-dialog-link";
import { CompleteReminderButton } from "./complete-reminder-button";
import { skipFormDefaults, skipFormToRequest } from "./forms/skip-form/mapper";
import { SkipForm } from "./forms/skip-form/skip-form";
import type { ActiveReminder } from "./reminders.queries";

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
  reminder,
}: {
  carId: string;
  reminder: ActiveReminder;
}) => {
  const { t } = useTranslation("garageReminders");
  const { t: tc } = useTranslation();
  const invalidate = useInvalidateGarage();
  const errorMessage = useErrorMessage();
  const { unit } = useFormat();
  const [skipping, setSkipping] = useState(false);

  return (
    <>
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
          <DropdownMenuItem
            onClick={() => {
              setSkipping(true);
            }}
          >
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
      <ResponsiveDialog
        description={t("skip.description")}
        onOpenChange={setSkipping}
        open={skipping}
        title={t("skip.title")}
      >
        <SkipForm
          defaultValues={skipFormDefaults(todayIso())}
          onSubmit={async (values) => {
            try {
              await unwrap(
                api.garage.reminders[":reminderId"].skip.$post({
                  json: skipFormToRequest(values, unit),
                  param: { reminderId: reminder.id },
                })
              );
              await invalidate();
              toast.success(t("tab.skipped"));
              setSkipping(false);
            } catch (error) {
              toast.error(errorMessage(error));
            }
          }}
        />
      </ResponsiveDialog>
    </>
  );
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

  const due = describeDue(reminder, format, tc);

  const extra = [t(`kinds.${reminder.kind}`), interval].filter(
    (part): part is string => part !== null && part !== ""
  );

  return (
    <ListRow className="gap-2.5 py-2 md:gap-3 md:py-1">
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
      {!readOnly && <ReminderMenu carId={carId} reminder={reminder} />}
    </ListRow>
  );
};
