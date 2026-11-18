import type { TFunction } from "i18next";

import type { useFormat } from "@/lib/format";

interface DueInfo {
  dueDate: string | null;
  daysLeft: number | null;
  kmLeft: number | null;
}

/** Short human text for when something is due, e.g. "in 5 days · in 800 km". */
export const describeDue = (
  due: DueInfo,
  format: ReturnType<typeof useFormat>,
  t: TFunction
): string => {
  const parts: string[] = [];

  if (due.daysLeft !== null && due.dueDate !== null) {
    if (due.daysLeft === 0) {
      parts.push(t("relative.today"));
    } else if (due.daysLeft > 0) {
      parts.push(
        due.daysLeft <= 60
          ? t("relative.inDays", { count: due.daysLeft })
          : format.date(due.dueDate)
      );
    } else {
      parts.push(t("relative.daysAgo", { count: -due.daysLeft }));
    }
  }

  if (due.kmLeft !== null) {
    const distance = format.distance(Math.abs(due.kmLeft));
    parts.push(
      due.kmLeft >= 0
        ? t("relative.inDistance", { distance })
        : t("relative.overDistance", { distance })
    );
  }

  return parts.join(" · ");
};
