import { isIsoDate, parseIsoDate } from "@shared/domain/dates";
import { useState } from "react";
import type { DateRange as PickedRange } from "react-day-picker";
import { enGB, mk } from "react-day-picker/locale";
import { useTranslation } from "react-i18next";

import { ResponsiveDialog } from "@/components/app/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { todayIso } from "@/lib/partial-date";

const isoToDate = (iso: string): Date | undefined => {
  if (!isIsoDate(iso)) {
    return undefined;
  }

  const { year, month, day } = parseIsoDate(iso);

  return new Date(year, month - 1, day);
};

const dateToIso = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
};

/** Pick a start and an end day on one calendar, then Apply. */
export const RangeDialog = ({
  initial,
  onApply,
  onOpenChange,
  open,
}: {
  initial: { from: string; to: string } | null;
  onApply: (range: { from: string; to: string }) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => {
  const { t, i18n } = useTranslation("finances");
  const { t: tc } = useTranslation();

  const [picked, setPicked] = useState<PickedRange | undefined>(
    initial === null
      ? undefined
      : { from: isoToDate(initial.from), to: isoToDate(initial.to) }
  );

  const from = picked?.from;
  const to = picked?.to ?? picked?.from;

  return (
    <ResponsiveDialog
      description={t("overview.period.customHint")}
      onOpenChange={onOpenChange}
      open={open}
      title={t("overview.period.customTitle")}
    >
      <div className="flex flex-col gap-3">
        <Calendar
          captionLayout="dropdown"
          className="mx-auto"
          defaultMonth={from ?? isoToDate(todayIso())}
          locale={i18n.language === "mk" ? mk : enGB}
          mode="range"
          onSelect={setPicked}
          selected={picked}
        />
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => {
              onOpenChange(false);
            }}
            size="compact"
            variant="outline"
          >
            {tc("actions.cancel")}
          </Button>
          <Button
            disabled={from === undefined || to === undefined}
            onClick={() => {
              if (from !== undefined && to !== undefined) {
                onApply({ from: dateToIso(from), to: dateToIso(to) });
                onOpenChange(false);
              }
            }}
            size="compact"
          >
            {t("overview.period.apply")}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
};
