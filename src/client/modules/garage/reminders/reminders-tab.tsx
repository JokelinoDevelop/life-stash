import { REMINDER_STATUSES } from "@shared/domain/reminders";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BellPlus, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormat } from "@/lib/format";

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
        <ChevronDown className={open ? "rotate-180" : undefined} />
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
    <Button asChild>
      <Link params={{ carId }} to="/garage/cars/$carId/reminders/new">
        <BellPlus />
        {t("tab.add")}
      </Link>
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
    <div className="flex flex-col gap-4">
      {addButton !== null && active.length > 0 && (
        <div className="flex justify-end">{addButton}</div>
      )}
      {active.length === 0 && (
        <EmptyState
          action={addButton}
          icon={<BellPlus className="size-10" />}
          message={t("tab.empty")}
        />
      )}
      {REMINDER_STATUSES.map((status) => {
        const group = active.filter((reminder) => reminder.status === status);

        return group.length === 0 ? null : (
          <Card key={status}>
            <CardHeader>
              <CardTitle>{t(`groups.${status}`)}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col divide-y">
                {group.map((reminder) => (
                  <ReminderRow
                    carId={carId}
                    key={reminder.id}
                    readOnly={readOnly}
                    reminder={reminder}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
      <CompletedList reminders={completed} />
    </div>
  );
};
