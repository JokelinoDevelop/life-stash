import type { ReminderStatus } from "@shared/domain/reminders";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

const VARIANT = {
  "due-soon": "dueSoon",
  overdue: "overdue",
  upcoming: "upcoming",
} as const satisfies Record<ReminderStatus, string>;

export const StatusBadge = ({ status }: { status: ReminderStatus }) => {
  const { t } = useTranslation();

  return <Badge variant={VARIANT[status]}>{t(`status.${status}`)}</Badge>;
};
