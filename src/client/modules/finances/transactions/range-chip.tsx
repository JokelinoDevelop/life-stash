import { CalendarDays, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";

import type { SearchPatch } from "./transactions-search";

/** A date range from the overview ("01.03.2026 – 31.03.2026 ×"); removing it goes back to the year. */
export const RangeChip = ({
  onChange,
  range,
}: {
  onChange: (patch: SearchPatch) => void;
  range: { from: string; to: string };
}) => {
  const { t } = useTranslation("finances");
  const format = useFormat();

  return (
    <Button
      aria-label={t("transactions.clearRange")}
      onClick={() => {
        onChange({ from: null, to: null });
      }}
      size="chip"
      variant="chip"
    >
      <CalendarDays />
      {format.date(range.from)} – {format.date(range.to)}
      <X />
    </Button>
  );
};
