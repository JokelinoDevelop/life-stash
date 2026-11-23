import { REMINDER_STATUSES } from "@shared/domain/reminders";
import { useQuery } from "@tanstack/react-query";
import { BellPlus, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ListSection } from "@/components/app/list-section";
import { PageStack } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useFormat } from "@/lib/format";
import { CAR_SHORTCUTS } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { EntryDialogLink } from "../entry-dialogs/entry-dialog-link";
import { ReminderRow } from "./reminder-row";
import { remindersQuery } from "./reminders.queries";
import type { CompletedReminder } from "./reminders.queries";

const CompletedList = ({ reminders }: { reminders: CompletedReminder[] }) => {
  const { t } = useTranslation("garageReminders");
  const format = useFormat();
  const [open, setOpen] = useState(false);

  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="self-start"
        onClick={() => {
          setOpen(!open);
        }}
        size="sm"
        variant="ghost"
      >
        <ChevronDown
          className={cn("transition-transform", open && "rotate-180")}
        />
        {t("tab.completed")}
      </Button>
      {open && (
        <ul className="flex flex-col divide-y rounded-xl border px-4">
          {reminders.map((reminder) => (
            <li
              className="flex justify-between gap-3 py-2 text-sm"
              key={reminder.id}
            >
              <span className="truncate">{reminder.title}</span>
              <span className="text-muted-foreground shrink-0">
                {t("tab.completedOn", {
                  date: format.date(reminder.completedAt.slice(0, 10)),
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const RemindersTab = ({
  carId,
  readOnly,
}: {
  carId: string;
  readOnly: boolean;
}) => {
  const { t } = useTranslation("garageReminders");
  const reminders = useQuery(remindersQuery(carId));

  const addButton = readOnly ? null : (
    <Button
      size="compact"
      render={<EntryDialogLink entry={{ car: carId, dialog: "reminder" }} />}
      nativeButton={false}
    >
      <BellPlus />
      {t("tab.add")}
      <Kbd className="hidden md:inline-flex">
        {CAR_SHORTCUTS.addReminder.toUpperCase()}
      </Kbd>
    </Button>
  );

  if (reminders.isPending) {
    return <LoadingState />;
  }

  if (reminders.isError) {
    return (
      <ErrorState
        error={reminders.error}
        onRetry={() => {
          void reminders.refetch();
        }}
      />
    );
  }

  const { active, completed } = reminders.data;

  return (
    <PageStack>
      {addButton !== null && active.length > 0 && (
        // Phones add from the header's + (Add reminder is in its menu).
        <div className="hidden justify-end md:flex">{addButton}</div>
      )}
      {active.length === 0 && (
        <EmptyState
          action={addButton}
          icon={<BellPlus />}
          message={t("tab.empty")}
        />
      )}
      {REMINDER_STATUSES.map((status) => {
        const group = active.filter((reminder) => reminder.status === status);

        return group.length === 0 ? null : (
          <ListSection
            count={group.length}
            key={status}
            title={t(`groups.${status}`)}
          >
            {group.map((reminder) => (
              <ReminderRow
                carId={carId}
                key={reminder.id}
                readOnly={readOnly}
                reminder={reminder}
              />
            ))}
          </ListSection>
        );
      })}
      <CompletedList reminders={completed} />
    </PageStack>
  );
};
